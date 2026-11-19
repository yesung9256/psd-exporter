// Browser-side PSD conversion engine (experimental).
// ag-psd creates Photoshop vector and text layers, not a flattened PNG.
import { writePsd, readPsd } from "https://esm.sh/ag-psd@29.0.0?bundle";

const n = (v, fallback=0) => Number.isFinite(Number(v)) ? Number(v) : fallback;
const px = value => ({ units: "Pixels", value });
const clamp = (v,lo,hi) => Math.min(hi,Math.max(lo,v));
function color(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex||"");
  const h = m ? m[1] : "777777";
  return { r:parseInt(h.slice(0,2),16),g:parseInt(h.slice(2,4),16),b:parseInt(h.slice(4,6),16) };
}
const hexColor = c => "#" + [c.r,c.g,c.b].map(v=>Math.round(v).toString(16).padStart(2,"0")).join("");
function knot(x,y,inx=x,iny=y,outx=x,outy=y) {
  return {linked:false,points:[inx,iny,x,y,outx,outy]};
}
function roundedPath(x,y,w,h,radii) {
  const [tl,tr,br,bl]=radii.map(r=>clamp(r,0,Math.min(w,h)/2));
  const k=0.552284749831;
  // In-handle, anchor, out-handle; clockwise.
  return {open:false,fillRule:"non-zero",knots:[
    knot(x+tl,y,x+tl,y,x+w-tr,y),
    knot(x+w-tr,y,x+w-tr,y,x+w-tr+k*tr,y),
    knot(x+w,y+tr,x+w,y+tr-k*tr,x+w,y+tr),
    knot(x+w,y+h-br,x+w,y+h-br,x+w,y+h-br+k*br),
    knot(x+w-br,y+h,x+w-br+k*br,y+h,x+w-br,y+h),
    knot(x+bl,y+h,x+bl,y+h,x+bl-k*bl,y+h),
    knot(x,y+h-bl,x,y+h-bl+k*bl,x,y+h-bl),
    knot(x,y+tl,x,y+tl,x,y+tl-k*tl)
  ]};
}
function rectPath(x,y,w,h,r) {
  // Rounded corners are represented by cubic Beziers.
  const [tl,tr,br,bl]=r;
  const k=0.552284749831;
  return {open:false,fillRule:"non-zero",knots:[
    knot(x+tl,y, x+tl,y, x+w-tr,y),
    knot(x+w-tr,y, x+w-tr,y, x+w-tr+k*tr,y),
    knot(x+w,y+tr, x+w,y+tr-k*tr, x+w,y+tr),
    knot(x+w,y+h-br, x+w,y+h-br, x+w,y+h-br+k*br),
    knot(x+w-br,y+h, x+w-br+k*br,y+h, x+w-br,y+h),
    knot(x+bl,y+h, x+bl,y+h, x+bl-k*bl,y+h),
    knot(x,y+h-bl, x,y+h-bl+k*bl, x,y+h-bl),
    knot(x,y+tl, x,y+tl, x,y+tl-k*tl)
  ]};
}
function ellipsePath(x,y,w,h) {
  const cx=x+w/2,cy=y+h/2,rx=w/2,ry=h/2,k=0.552284749831;
  return {open:false,fillRule:"non-zero",knots:[
    knot(cx,y,cx-k*rx,y,cx+k*rx,y),
    knot(x+w,cy,x+w,cy-k*ry,x+w,cy+k*ry),
    knot(cx,y+h,cx+k*rx,y+h,cx-k*rx,y+h),
    knot(x,cy,x,cy+k*ry,x,cy-k*ry)
  ]};
}
function radius(shape) {
  const r=n(shape.borderRadius);
  return [shape.borderRadiusTopLeft,shape.borderRadiusTopRight,shape.borderRadiusBottomRight,shape.borderRadiusBottomLeft].map(v=>n(v,r));
}
function canvasFor(w,h) {const c=document.createElement("canvas");c.width=Math.max(1,Math.ceil(w));c.height=Math.max(1,Math.ceil(h));return c;}
function drawShape(s,w,h,fill,kind,r) {
  const c=canvasFor(w,h),ctx=c.getContext("2d");
  ctx.fillStyle=fill;
  if(kind==="ellipse"){ctx.beginPath();ctx.ellipse(w/2,h/2,w/2,h/2,0,0,2*Math.PI);ctx.fill();}
  else {ctx.beginPath();ctx.roundRect(0,0,w,h,[r[0],r[1],r[2],r[3]]);ctx.fill();}
  return c;
}
function shapeLayer(s,origin,scale,warnings) {
  const x=(n(s.x)-origin.x)*scale,y=(n(s.y)-origin.y)*scale;
  const w=Math.max(1,n(s.width,1)*scale),h=Math.max(1,n(s.height,1)*scale);
  const base={name:s.name||s.type,top:Math.round(y),left:Math.round(x),opacity:clamp(n(s.opacity,1),0,1)};
  const first=(s.fills||[]).find(f=>f.fillColor && !f.fillImage && !f.fillColorGradient);
  if(!first){warnings.push(s.name+": solid fill not found; skipped");return null;}
  const c=color(first.fillColor),r=radius(s).map(v=>v*scale);
  const kind=s.type==="ellipse"?"ellipse":"rectangle";
  const path=kind==="ellipse"?ellipsePath(x,y,w,h):rectPath(x,y,w,h,r);
  const preview=drawShape(s,w,h,hexColor(c),kind,r);
  const box={top:px(y),left:px(x),bottom:px(y+h),right:px(x+w)};
  const radii={topLeft:px(r[0]),topRight:px(r[1]),bottomRight:px(r[2]),bottomLeft:px(r[3])};
  const live={keyOriginType:kind==="ellipse"?5:r.some(Boolean)?2:1,keyOriginResolution:72,keyOriginShapeBoundingBox:box};
  if(kind!=="ellipse")live.keyOriginRRectRadii=radii;
  return {...base,canvas:preview,vectorFill:{type:"color",color:c},vectorMask:{paths:[path]},vectorOrigination:{keyDescriptorList:[live]}};
}
function textLayer(s,origin,scale,warnings) {
  const x=(n(s.x)-origin.x)*scale,y=(n(s.y)-origin.y)*scale;
  const size=n(s.fontSize,16)*scale;
  const fill=(s.fills||[]).find(f=>f.fillColor);
  const col=color(fill?.fillColor||"#000000");
  const content=String(s.characters||"");
  const w=Math.max(1,n(s.width,1)*scale),h=Math.max(size*1.4,n(s.height,1)*scale);
  const c=canvasFor(w,h),ctx=c.getContext("2d");
  ctx.font=`${s.fontWeight||400} ${size}px "${s.fontFamily||"Arial"}"`;
  ctx.fillStyle=hexColor(col);
  content.split("\n").forEach((line,i)=>ctx.fillText(line,0,size*(i+1)));
  warnings.push(s.name+": font metrics may differ in Photoshop");
  return {name:s.name||"Text",top:Math.round(y),left:Math.round(x),canvas:c,
    text:{text:content,transform:[1,0,0,1,x,y+size],
      style:{font:{name:s.fontFamily||"ArialMT"},fontSize:size,fillColor:col},
      paragraphStyle:{justification:s.align==="center"?"center":s.align==="right"?"right":"left"}}};
}
function convertNode(s,origin,scale,warnings) {
  if(s.visible===false)return null;
  if(s.type==="group"||s.type==="board"){
    return {name:s.name||"Group",opened:true,children:(s.children||[]).map(child=>convertNode(child,origin,scale,warnings)).filter(Boolean).reverse()};
  }
  if(s.type==="rect"||s.type==="rectangle"||s.type==="ellipse")return shapeLayer(s,origin,scale,warnings);
  if(s.type==="text")return textLayer(s,origin,scale,warnings);
  warnings.push((s.name||s.type)+": unsupported element type "+s.type);
  return null;
}
export function exportEditablePsd(scene,scale=1){
  const board=scene.board;
  if(!board||!Number.isFinite(Number(board.width))||!Number.isFinite(Number(board.height)))throw Error("Invalid board");
  const origin={x:n(board.x),y:n(board.y)};
  const warnings=[];
  const children=(board.children||[]).map(s=>convertNode(s,origin,scale,warnings)).filter(Boolean).reverse();
  const psd={width:Math.round(n(board.width)*scale),height:Math.round(n(board.height)*scale),children};
  if(psd.width<1||psd.height<1||psd.width>30000||psd.height>30000)throw Error("Unsupported canvas size");
  const bytes=writePsd(psd);
  // Parse the bytes to detect corrupt PSD output before downloading.
  const verified=readPsd(bytes,{skipLayerImageData:true,skipCompositeImageData:true});
  if(verified.width!==psd.width||verified.height!==psd.height)throw Error("PSD round-trip validation failed");
  return {bytes,warnings,layerCount:children.length};
}
