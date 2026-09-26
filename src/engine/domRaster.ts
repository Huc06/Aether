/**
 * DOM Rasterizer for WebGL2 Canvas Shaders & Effects
 * Repaints the live DOM subtree into an HTMLCanvasElement using Canvas2D
 * Compatible across Chrome, Firefox, and Safari without requiring experimental flags.
 */

const SKIPPED = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE", "HEAD"]);
const TRANSPARENT = /^(transparent|rgba\(0,\s*0,\s*0,\s*0\))$/;

const SVG_PAINT = [
  "fill", "fill-opacity", "fill-rule",
  "stroke", "stroke-width", "stroke-opacity",
  "stroke-linecap", "stroke-linejoin",
  "stroke-dasharray", "stroke-dashoffset",
  "opacity", "color", "display", "visibility",
  "transform", "transform-origin",
  "font-family", "font-size", "font-weight", "text-anchor",
];

const SVG_CACHE_LIMIT = 64;
const RING = /(rgba?\([^)]*\))\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+(-?[\d.]+)px/;
const GRADIENT_STOP = /(rgba?\([^)]*\))\s+(-?[\d.]+)px/g;
const CLEAR = /^rgba?\([^)]*,\s*0\)$/;

function splitList(value: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < value.length; i++) {
    const c = value[i];
    if (c === "(") depth++;
    else if (c === ")") depth--;
    else if (c === "," && depth === 0) {
      parts.push(value.slice(start, i).trim());
      start = i + 1;
    }
  }
  parts.push(value.slice(start).trim());
  return parts;
}

function lengthOf(token: string | undefined, basis: number): number {
  if (!token) return basis;
  if (token.endsWith("%")) return (parseFloat(token) / 100) * basis;
  const value = parseFloat(token);
  return Number.isFinite(value) ? value : basis;
}

function dashOf(layer: string) {
  if (!layer.startsWith("repeating-linear-gradient")) return null;
  GRADIENT_STOP.lastIndex = 0;
  let colour = "";
  let dash = 0;
  let period = 0;
  let match: RegExpExecArray | null;
  while ((match = GRADIENT_STOP.exec(layer))) {
    const [, stopColour, offset] = match;
    const at = parseFloat(offset!);
    period = Math.max(period, at);
    if (CLEAR.test(stopColour!)) {
      if (!dash) dash = at;
    } else if (!colour) {
      colour = stopColour!;
    }
  }
  if (!colour || period <= 0) return null;
  return { colour, dash: dash || period, period };
}

export interface DomRaster {
  readonly canvas: HTMLCanvasElement;
  paint: (dpr: number) => boolean;
}

export function createDomRaster(
  root: HTMLElement,
  background: string,
  onReady?: () => void,
): DomRaster | null {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return null;

  const svgCache = new Map<string, HTMLImageElement>();

  function inlinePaint(source: Element, clone: Element) {
    const style = getComputedStyle(source);
    let inline = "";
    for (const property of SVG_PAINT) {
      const value = style.getPropertyValue(property);
      if (value) inline += `${property}:${value};`;
    }
    clone.setAttribute("style", inline);
    const from = source.children;
    const to = clone.children;
    for (let i = 0; i < from.length && i < to.length; i++) {
      inlinePaint(from[i]!, to[i]!);
    }
  }

  function svgImage(element: SVGSVGElement, rect: DOMRect) {
    const clone = element.cloneNode(true) as SVGSVGElement;
    inlinePaint(element, clone);
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("width", String(rect.width));
    clone.setAttribute("height", String(rect.height));
    if (!clone.getAttribute("viewBox")) {
      clone.setAttribute("viewBox", `0 0 ${rect.width} ${rect.height}`);
    }

    const markup = new XMLSerializer().serializeToString(clone);
    const cached = svgCache.get(markup);
    if (cached) return cached.complete && cached.naturalWidth > 0 ? cached : null;

    const image = new Image();
    image.addEventListener("load", () => onReady?.(), { once: true });
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
    svgCache.set(markup, image);
    if (svgCache.size > SVG_CACHE_LIMIT) {
      const oldest = svgCache.keys().next().value;
      if (oldest !== undefined) svgCache.delete(oldest);
    }
    return null;
  }

  const range = document.createRange();

  function paintText(node: Text, style: CSSStyleDeclaration, origin: DOMRect) {
    const value = node.nodeValue;
    if (!value || !value.trim()) return;

    range.selectNodeContents(node);
    const rects = range.getClientRects();
    if (rects.length === 0) return;

    ctx!.fillStyle = style.color;
    ctx!.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    ctx!.textBaseline = "middle";
    ctx!.textAlign = "left";

    if (rects.length === 1) {
      const rect = rects[0]!;
      ctx!.fillText(
        value,
        rect.left - origin.left,
        (rect.top + rect.bottom) / 2 - origin.top,
      );
      return;
    }

    let line = 0;
    let start = 0;
    for (let i = 0; i <= value.length; i++) {
      let moved = i === value.length;
      if (!moved) {
        range.setStart(node, i);
        range.setEnd(node, i + 1);
        const here = range.getBoundingClientRect();
        moved = here.top >= rects[line]!.bottom - 1;
      }
      if (!moved) continue;

      const rect = rects[Math.min(line, rects.length - 1)]!;
      ctx!.fillText(
        value.slice(start, i),
        rect.left - origin.left,
        (rect.top + rect.bottom) / 2 - origin.top,
      );
      start = i;
      line += 1;
      if (line >= rects.length) break;
    }
    range.selectNodeContents(node);
  }

  function paintRules(
    style: CSSStyleDeclaration,
    rect: DOMRect,
    x: number,
    y: number,
  ) {
    const image = style.backgroundImage;
    if (!image || image === "none") return;

    const layers = splitList(image);
    const sizes = splitList(style.backgroundSize);
    const positions = splitList(style.backgroundPosition);

    for (let i = 0; i < layers.length; i++) {
      const dash = dashOf(layers[i]!);
      if (!dash) continue;

      const size = (sizes[i] ?? sizes[0] ?? "auto").split(/\s+/);
      const width = lengthOf(size[0], rect.width);
      const height = lengthOf(size[1], rect.height);
      if (width < 0.5 || height < 0.5) continue;

      const position = (positions[i] ?? positions[0] ?? "0px 0px").split(/\s+/);
      const left = x + lengthOf(position[0], rect.width - width);
      const top = y + lengthOf(position[1], rect.height - height);

      ctx!.save();
      ctx!.strokeStyle = dash.colour;
      ctx!.setLineDash([dash.dash, dash.period - dash.dash]);
      ctx!.beginPath();
      if (width >= height) {
        ctx!.lineWidth = height;
        ctx!.moveTo(left, top + height / 2);
        ctx!.lineTo(left + width, top + height / 2);
      } else {
        ctx!.lineWidth = width;
        ctx!.moveTo(left + width / 2, top);
        ctx!.lineTo(left + width / 2, top + height);
      }
      ctx!.stroke();
      ctx!.restore();
    }
  }

  function paintBox(
    element: Element,
    style: CSSStyleDeclaration,
    origin: DOMRect,
  ) {
    const rect = element.getBoundingClientRect();
    if (rect.width < 0.5 || rect.height < 0.5) return;

    const x = rect.left - origin.left;
    const y = rect.top - origin.top;
    const radius = Math.min(
      parseFloat(style.borderTopLeftRadius) || 0,
      rect.width / 2,
      rect.height / 2,
    );

    const trace = () => {
      ctx!.beginPath();
      if (radius > 0) ctx!.roundRect(x, y, rect.width, rect.height, radius);
      else ctx!.rect(x, y, rect.width, rect.height);
    };

    if (!TRANSPARENT.test(style.backgroundColor)) {
      ctx!.fillStyle = style.backgroundColor;
      trace();
      ctx!.fill();
    }

    const width = parseFloat(style.borderTopWidth) || 0;
    if (width > 0 && style.borderTopStyle !== "none" &&
        !TRANSPARENT.test(style.borderTopColor)) {
      ctx!.strokeStyle = style.borderTopColor;
      ctx!.lineWidth = width;
      trace();
      ctx!.stroke();
    }

    paintRules(style, rect, x, y);
    paintFocusRing(element, style, rect, x, y, radius);
  }

  function paintFocusRing(
    element: Element,
    style: CSSStyleDeclaration,
    rect: DOMRect,
    x: number,
    y: number,
    radius: number,
  ) {
    try {
      if (!element.matches(":focus-visible")) return;
    } catch {
      return;
    }

    const ring = (colour: string, thickness: number, offset: number) => {
      const inset = -offset - thickness / 2;
      const w = rect.width - inset * 2;
      const h = rect.height - inset * 2;
      if (w <= 0 || h <= 0) return;
      ctx!.save();
      ctx!.strokeStyle = colour;
      ctx!.lineWidth = thickness;
      ctx!.beginPath();
      ctx!.roundRect(x + inset, y + inset, w, h, Math.max(radius - inset, 0));
      ctx!.stroke();
      ctx!.restore();
    };

    const outline = parseFloat(style.outlineWidth) || 0;
    if (
      outline > 0 &&
      style.outlineStyle !== "none" &&
      !TRANSPARENT.test(style.outlineColor)
    ) {
      ring(style.outlineColor, outline, parseFloat(style.outlineOffset) || 0);
      return;
    }

    const shadow = RING.exec(style.boxShadow);
    if (!shadow) return;
    const [, colour, offsetX, offsetY, blur, spread] = shadow;
    if (parseFloat(offsetX!) || parseFloat(offsetY!) || parseFloat(blur!)) return;
    const thickness = parseFloat(spread!);
    if (thickness > 0 && !TRANSPARENT.test(colour!)) ring(colour!, thickness, 0);
  }

  function paintGraphic(element: Element, origin: DOMRect): boolean {
    if (element instanceof SVGSVGElement) {
      const rect = element.getBoundingClientRect();
      if (rect.width < 0.5 || rect.height < 0.5) return true;
      const image = svgImage(element, rect);
      if (image) {
        ctx!.drawImage(
          image,
          rect.left - origin.left,
          rect.top - origin.top,
          rect.width,
          rect.height,
        );
      }
      return true;
    }

    if (element instanceof HTMLImageElement) {
      const rect = element.getBoundingClientRect();
      if (rect.width < 0.5 || rect.height < 0.5) return true;
      if (element.complete && element.naturalWidth > 0) {
        ctx!.drawImage(
          element,
          rect.left - origin.left,
          rect.top - origin.top,
          rect.width,
          rect.height,
        );
      } else {
        element.addEventListener("load", () => onReady?.(), { once: true });
      }
      return true;
    }

    return false;
  }

  function walk(node: Node, origin: DOMRect) {
    if (node.nodeType === Node.TEXT_NODE) {
      const parent = (node as Text).parentElement;
      if (parent) paintText(node as Text, getComputedStyle(parent), origin);
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const element = node as Element;
    if (SKIPPED.has(element.tagName)) return;

    const style = getComputedStyle(element);
    if (
      style.display === "none" ||
      style.visibility === "hidden" ||
      style.opacity === "0"
    ) {
      return;
    }

    paintBox(element, style, origin);
    if (paintGraphic(element, origin)) return;
    for (const child of element.childNodes) walk(child, origin);
  }

  return {
    canvas,
    paint(dpr) {
      const origin = root.getBoundingClientRect();
      if (origin.width < 1 || origin.height < 1) return false;

      const width = Math.max(1, Math.round(origin.width * dpr));
      const height = Math.max(1, Math.round(origin.height * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.fillStyle = background;
      ctx!.fillRect(0, 0, origin.width, origin.height);

      for (const child of root.childNodes) walk(child, origin);
      return true;
    },
  };
}
