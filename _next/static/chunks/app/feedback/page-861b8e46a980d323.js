(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[9525],{18127:function(e,n,t){Promise.resolve().then(t.bind(t,30059))},30059:function(e,n,t){"use strict";t.r(n),t.d(n,{default:function(){return g}});var a=t(57437),r=t(2265),s=t(10928),l=t(2141),i=t(70236),c=t(89048),o=t(66070),d=t(53647),u=t(31047),m=t(94508),f=t(62869),h=t(1098),p=t(57054);function x(e){let{className:n,value:t,onChange:r}=e;return(0,a.jsx)("div",{className:(0,m.cn)("grid gap-2",n),children:(0,a.jsxs)(p.J2,{children:[(0,a.jsx)(p.xo,{asChild:!0,children:(0,a.jsxs)(f.z,{id:"date",variant:"outline",className:(0,m.cn)("w-[300px] justify-start text-left font-normal",!t&&"text-muted-foreground"),children:[(0,a.jsx)(u.Z,{className:"mr-2 h-4 w-4"}),(null==t?void 0:t.from)?t.to?(0,a.jsxs)(a.Fragment,{children:[(0,i.Z)(t.from,"LLL dd, y",{locale:c.Z})," -"," ",(0,i.Z)(t.to,"LLL dd, y",{locale:c.Z})]}):(0,i.Z)(t.from,"LLL dd, y",{locale:c.Z}):(0,a.jsx)("span",{children:"Seleccionar fechas"})]})}),(0,a.jsx)(p.yk,{className:"w-auto p-0",align:"start",children:(0,a.jsx)(h.f,{initialFocus:!0,mode:"range",defaultMonth:null==t?void 0:t.from,selected:t,onSelect:r,numberOfMonths:2})})]})})}var v=t(35974),N=t(27648);let j=[{accessorKey:"created_at",header:"Fecha",cell:e=>{let{row:n}=e;return(0,i.Z)(new Date(n.getValue("created_at")),"PPP",{locale:c.Z})}},{accessorKey:"cliente_nombre",header:"Cliente"},{accessorKey:"estado",header:"Estado",cell:e=>{let{row:n}=e;return(0,a.jsx)(v.C,{variant:"completado"===n.getValue("estado")?"success":"secondary",children:n.getValue("estado")})}},{accessorKey:"puntaje",header:"Puntaje",cell:e=>{let{row:n}=e;return n.getValue("puntaje")?"".concat(n.getValue("puntaje"),"/10"):"-"}},{accessorKey:"clasificacion",header:"Clasificaci\xf3n",cell:e=>{let{row:n}=e,t=n.getValue("clasificacion");return t?(0,a.jsx)(v.C,{variant:"promotor"===t?"success":"neutral"===t?"warning":"destructive",children:t}):"-"}},{accessorKey:"transaccion_id",header:"Transacci\xf3n",cell:e=>{let{row:n}=e;return(0,a.jsx)(N.default,{href:"/transacciones?id=".concat(n.getValue("transaccion_id")),className:"text-primary hover:underline",children:"Ver transacci\xf3n"})}}];function g(){let[e,n]=(0,r.useState)([]),[t,i]=(0,r.useState)(!0),[c,u]=(0,r.useState)({estado:"todos",dateRange:void 0,clasificacion:"todas"}),m=async()=>{i(!0);try{let e=l.O.from("nps").select("\n          *,\n          transacciones_servicio (\n            citas (\n              clientes (\n                nombre\n              )\n            )\n          )\n        ");"todos"!==c.estado&&(e=e.eq("estado",c.estado)),"todas"!==c.clasificacion&&(e=e.eq("clasificacion",c.clasificacion)),c.dateRange&&(e=(e=e.gte("created_at",c.dateRange.from)).lte("created_at",c.dateRange.to));let{data:t,error:a}=await e;if(a)throw a;let r=t.map(e=>{var n,t,a;return{...e,cliente_nombre:(null===(a=e.transacciones_servicio)||void 0===a?void 0:null===(t=a.citas)||void 0===t?void 0:null===(n=t.clientes)||void 0===n?void 0:n.nombre)||"-"}});n(r)}catch(e){console.error("Error:",e)}finally{i(!1)}};return(0,r.useEffect)(()=>{m()},[c]),(0,a.jsxs)("div",{className:"container mx-auto py-10",children:[(0,a.jsx)("h1",{className:"text-3xl font-bold mb-8",children:"Feedback NPS"}),(0,a.jsxs)("div",{className:"grid grid-cols-3 gap-4 mb-8",children:[(0,a.jsx)(o.Zb,{className:"p-4",children:(0,a.jsx)("h3",{className:"font-medium mb-2",children:"NPS Score"})}),(0,a.jsx)(o.Zb,{className:"p-4",children:(0,a.jsx)("h3",{className:"font-medium mb-2",children:"Respuestas Pendientes"})}),(0,a.jsx)(o.Zb,{className:"p-4",children:(0,a.jsx)("h3",{className:"font-medium mb-2",children:"\xdaltima Respuesta"})})]}),(0,a.jsxs)("div",{className:"flex gap-4 mb-6",children:[(0,a.jsxs)(d.Ph,{value:c.estado,onValueChange:e=>u(n=>({...n,estado:e})),children:[(0,a.jsx)(d.i4,{className:"w-[180px]",children:(0,a.jsx)(d.ki,{placeholder:"Estado"})}),(0,a.jsxs)(d.Bw,{children:[(0,a.jsx)(d.Ql,{value:"todos",children:"Todos"}),(0,a.jsx)(d.Ql,{value:"pendiente",children:"Pendiente"}),(0,a.jsx)(d.Ql,{value:"completado",children:"Completado"})]})]}),(0,a.jsxs)(d.Ph,{value:c.clasificacion,onValueChange:e=>u(n=>({...n,clasificacion:e})),children:[(0,a.jsx)(d.i4,{className:"w-[180px]",children:(0,a.jsx)(d.ki,{placeholder:"Clasificaci\xf3n"})}),(0,a.jsxs)(d.Bw,{children:[(0,a.jsx)(d.Ql,{value:"todas",children:"Todas"}),(0,a.jsx)(d.Ql,{value:"promotor",children:"Promotor"}),(0,a.jsx)(d.Ql,{value:"neutral",children:"Neutral"}),(0,a.jsx)(d.Ql,{value:"detractor",children:"Detractor"})]})]}),(0,a.jsx)(x,{value:c.dateRange,onChange:e=>u(n=>({...n,dateRange:e}))})]}),(0,a.jsx)("div",{className:"space-y-4",children:t?(0,a.jsx)("div",{className:"flex items-center justify-center p-8",children:(0,a.jsx)("div",{className:"animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"})}):(0,a.jsx)(s.w,{columns:j,data:e})})]})}},66070:function(e,n,t){"use strict";t.d(n,{Ol:function(){return i},SZ:function(){return o},Zb:function(){return l},aY:function(){return d},ll:function(){return c}});var a=t(57437),r=t(2265),s=t(94508);let l=r.forwardRef((e,n)=>{let{className:t,...r}=e;return(0,a.jsx)("div",{ref:n,className:(0,s.cn)("rounded-xl border bg-card text-card-foreground shadow",t),...r})});l.displayName="Card";let i=r.forwardRef((e,n)=>{let{className:t,...r}=e;return(0,a.jsx)("div",{ref:n,className:(0,s.cn)("flex flex-col space-y-1.5 p-6",t),...r})});i.displayName="CardHeader";let c=r.forwardRef((e,n)=>{let{className:t,...r}=e;return(0,a.jsx)("h3",{ref:n,className:(0,s.cn)("font-semibold leading-none tracking-tight",t),...r})});c.displayName="CardTitle";let o=r.forwardRef((e,n)=>{let{className:t,...r}=e;return(0,a.jsx)("p",{ref:n,className:(0,s.cn)("text-sm text-muted-foreground",t),...r})});o.displayName="CardDescription";let d=r.forwardRef((e,n)=>{let{className:t,...r}=e;return(0,a.jsx)("div",{ref:n,className:(0,s.cn)("p-6 pt-0",t),...r})});d.displayName="CardContent"},71599:function(e,n,t){"use strict";t.d(n,{z:function(){return l}});var a=t(2265),r=t(98575),s=t(61188),l=e=>{var n,t;let l,c;let{present:o,children:d}=e,u=function(e){var n,t;let[r,l]=a.useState(),c=a.useRef({}),o=a.useRef(e),d=a.useRef("none"),[u,m]=(n=e?"mounted":"unmounted",t={mounted:{UNMOUNT:"unmounted",ANIMATION_OUT:"unmountSuspended"},unmountSuspended:{MOUNT:"mounted",ANIMATION_END:"unmounted"},unmounted:{MOUNT:"mounted"}},a.useReducer((e,n)=>{let a=t[e][n];return null!=a?a:e},n));return a.useEffect(()=>{let e=i(c.current);d.current="mounted"===u?e:"none"},[u]),(0,s.b)(()=>{let n=c.current,t=o.current;if(t!==e){let a=d.current,r=i(n);e?m("MOUNT"):"none"===r||(null==n?void 0:n.display)==="none"?m("UNMOUNT"):t&&a!==r?m("ANIMATION_OUT"):m("UNMOUNT"),o.current=e}},[e,m]),(0,s.b)(()=>{if(r){var e;let n;let t=null!==(e=r.ownerDocument.defaultView)&&void 0!==e?e:window,a=e=>{let a=i(c.current).includes(e.animationName);if(e.target===r&&a&&(m("ANIMATION_END"),!o.current)){let e=r.style.animationFillMode;r.style.animationFillMode="forwards",n=t.setTimeout(()=>{"forwards"===r.style.animationFillMode&&(r.style.animationFillMode=e)})}},s=e=>{e.target===r&&(d.current=i(c.current))};return r.addEventListener("animationstart",s),r.addEventListener("animationcancel",a),r.addEventListener("animationend",a),()=>{t.clearTimeout(n),r.removeEventListener("animationstart",s),r.removeEventListener("animationcancel",a),r.removeEventListener("animationend",a)}}m("ANIMATION_END")},[r,m]),{isPresent:["mounted","unmountSuspended"].includes(u),ref:a.useCallback(e=>{e&&(c.current=getComputedStyle(e)),l(e)},[])}}(o),m="function"==typeof d?d({present:u.isPresent}):a.Children.only(d),f=(0,r.e)(u.ref,(l=null===(n=Object.getOwnPropertyDescriptor(m.props,"ref"))||void 0===n?void 0:n.get)&&"isReactWarning"in l&&l.isReactWarning?m.ref:(l=null===(t=Object.getOwnPropertyDescriptor(m,"ref"))||void 0===t?void 0:t.get)&&"isReactWarning"in l&&l.isReactWarning?m.props.ref:m.props.ref||m.ref);return"function"==typeof d||u.isPresent?a.cloneElement(m,{ref:f}):null};function i(e){return(null==e?void 0:e.animationName)||"none"}l.displayName="Presence"}},function(e){e.O(0,[6137,3777,4384,6008,3026,2130,51,7648,8385,4973,9793,2971,2117,1744],function(){return e(e.s=18127)}),_N_E=e.O()}]);