(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[9525],{18127:function(e,a,s){Promise.resolve().then(s.bind(s,30059))},30059:function(e,a,s){"use strict";s.r(a),s.d(a,{default:function(){return g}});var n=s(57437),t=s(2265),r=s(10928),l=s(2141),c=s(70236),i=s(89048),d=s(66070),o=s(53647),u=s(31047),m=s(94508),f=s(62869),h=s(1098),x=s(57054);function j(e){let{className:a,value:s,onChange:t}=e;return(0,n.jsx)("div",{className:(0,m.cn)("grid gap-2",a),children:(0,n.jsxs)(x.J2,{children:[(0,n.jsx)(x.xo,{asChild:!0,children:(0,n.jsxs)(f.z,{id:"date",variant:"outline",className:(0,m.cn)("w-[300px] justify-start text-left font-normal",!s&&"text-muted-foreground"),children:[(0,n.jsx)(u.Z,{className:"mr-2 h-4 w-4"}),(null==s?void 0:s.from)?s.to?(0,n.jsxs)(n.Fragment,{children:[(0,c.Z)(s.from,"LLL dd, y",{locale:i.Z})," -"," ",(0,c.Z)(s.to,"LLL dd, y",{locale:i.Z})]}):(0,c.Z)(s.from,"LLL dd, y",{locale:i.Z}):(0,n.jsx)("span",{children:"Seleccionar fechas"})]})}),(0,n.jsx)(x.yk,{className:"w-auto p-0",align:"start",children:(0,n.jsx)(h.f,{initialFocus:!0,mode:"range",defaultMonth:null==s?void 0:s.from,selected:s,onSelect:t,numberOfMonths:2})})]})})}var p=s(35974),v=s(27648);let N=[{accessorKey:"created_at",header:"Fecha",cell:e=>{let{row:a}=e;return(0,c.Z)(new Date(a.getValue("created_at")),"PPP",{locale:i.Z})}},{accessorKey:"cliente_nombre",header:"Cliente"},{accessorKey:"estado",header:"Estado",cell:e=>{let{row:a}=e;return(0,n.jsx)(p.C,{variant:"completado"===a.getValue("estado")?"success":"secondary",children:a.getValue("estado")})}},{accessorKey:"puntaje",header:"Puntaje",cell:e=>{let{row:a}=e;return a.getValue("puntaje")?"".concat(a.getValue("puntaje"),"/10"):"-"}},{accessorKey:"clasificacion",header:"Clasificaci\xf3n",cell:e=>{let{row:a}=e,s=a.getValue("clasificacion");return s?(0,n.jsx)(p.C,{variant:"promotor"===s?"success":"neutral"===s?"warning":"destructive",children:s}):"-"}},{accessorKey:"transaccion_id",header:"Transacci\xf3n",cell:e=>{let{row:a}=e;return(0,n.jsx)(v.default,{href:"/transacciones?id=".concat(a.getValue("transaccion_id")),className:"text-primary hover:underline",children:"Ver transacci\xf3n"})}}];function g(){let[e,a]=(0,t.useState)([]),[s,c]=(0,t.useState)(!0),[i,u]=(0,t.useState)({estado:"todos",dateRange:void 0,clasificacion:"todas"}),m=async()=>{c(!0);try{let e=l.O.from("nps").select("\n          *,\n          transacciones_servicio (\n            citas (\n              clientes (\n                nombre\n              )\n            )\n          )\n        ");"todos"!==i.estado&&(e=e.eq("estado",i.estado)),"todas"!==i.clasificacion&&(e=e.eq("clasificacion",i.clasificacion)),i.dateRange&&(e=(e=e.gte("created_at",i.dateRange.from)).lte("created_at",i.dateRange.to));let{data:s,error:n}=await e;if(n)throw n;let t=s.map(e=>{var a,s,n;return{...e,cliente_nombre:(null===(n=e.transacciones_servicio)||void 0===n?void 0:null===(s=n.citas)||void 0===s?void 0:null===(a=s.clientes)||void 0===a?void 0:a.nombre)||"-"}});a(t)}catch(e){console.error("Error:",e)}finally{c(!1)}};return(0,t.useEffect)(()=>{m()},[i]),(0,n.jsxs)("div",{className:"container mx-auto py-10",children:[(0,n.jsx)("h1",{className:"text-3xl font-bold mb-8",children:"Feedback NPS"}),(0,n.jsxs)("div",{className:"grid grid-cols-3 gap-4 mb-8",children:[(0,n.jsx)(d.Zb,{className:"p-4",children:(0,n.jsx)("h3",{className:"font-medium mb-2",children:"NPS Score"})}),(0,n.jsx)(d.Zb,{className:"p-4",children:(0,n.jsx)("h3",{className:"font-medium mb-2",children:"Respuestas Pendientes"})}),(0,n.jsx)(d.Zb,{className:"p-4",children:(0,n.jsx)("h3",{className:"font-medium mb-2",children:"\xdaltima Respuesta"})})]}),(0,n.jsxs)("div",{className:"flex gap-4 mb-6",children:[(0,n.jsxs)(o.Ph,{value:i.estado,onValueChange:e=>u(a=>({...a,estado:e})),children:[(0,n.jsx)(o.i4,{className:"w-[180px]",children:(0,n.jsx)(o.ki,{placeholder:"Estado"})}),(0,n.jsxs)(o.Bw,{children:[(0,n.jsx)(o.Ql,{value:"todos",children:"Todos"}),(0,n.jsx)(o.Ql,{value:"pendiente",children:"Pendiente"}),(0,n.jsx)(o.Ql,{value:"completado",children:"Completado"})]})]}),(0,n.jsxs)(o.Ph,{value:i.clasificacion,onValueChange:e=>u(a=>({...a,clasificacion:e})),children:[(0,n.jsx)(o.i4,{className:"w-[180px]",children:(0,n.jsx)(o.ki,{placeholder:"Clasificaci\xf3n"})}),(0,n.jsxs)(o.Bw,{children:[(0,n.jsx)(o.Ql,{value:"todas",children:"Todas"}),(0,n.jsx)(o.Ql,{value:"promotor",children:"Promotor"}),(0,n.jsx)(o.Ql,{value:"neutral",children:"Neutral"}),(0,n.jsx)(o.Ql,{value:"detractor",children:"Detractor"})]})]}),(0,n.jsx)(j,{value:i.dateRange,onChange:e=>u(a=>({...a,dateRange:e}))})]}),(0,n.jsx)("div",{className:"space-y-4",children:s?(0,n.jsx)("div",{className:"flex items-center justify-center p-8",children:(0,n.jsx)("div",{className:"animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"})}):(0,n.jsx)(r.w,{columns:N,data:e})})]})}},66070:function(e,a,s){"use strict";s.d(a,{Ol:function(){return c},Zb:function(){return l},aY:function(){return d},ll:function(){return i}});var n=s(57437),t=s(2265),r=s(94508);let l=t.forwardRef((e,a)=>{let{className:s,...t}=e;return(0,n.jsx)("div",{ref:a,className:(0,r.cn)("rounded-xl border bg-card text-card-foreground shadow",s),...t})});l.displayName="Card";let c=t.forwardRef((e,a)=>{let{className:s,...t}=e;return(0,n.jsx)("div",{ref:a,className:(0,r.cn)("flex flex-col space-y-1.5 p-6",s),...t})});c.displayName="CardHeader";let i=t.forwardRef((e,a)=>{let{className:s,...t}=e;return(0,n.jsx)("h3",{ref:a,className:(0,r.cn)("font-semibold leading-none tracking-tight",s),...t})});i.displayName="CardTitle",t.forwardRef((e,a)=>{let{className:s,...t}=e;return(0,n.jsx)("p",{ref:a,className:(0,r.cn)("text-sm text-muted-foreground",s),...t})}).displayName="CardDescription";let d=t.forwardRef((e,a)=>{let{className:s,...t}=e;return(0,n.jsx)("div",{ref:a,className:(0,r.cn)("p-6 pt-0",s),...t})});d.displayName="CardContent"}},function(e){e.O(0,[6137,3777,4384,6008,3026,6320,7648,51,8385,4973,9793,2971,2117,1744],function(){return e(e.s=18127)}),_N_E=e.O()}]);