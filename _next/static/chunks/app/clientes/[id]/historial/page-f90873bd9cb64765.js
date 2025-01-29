(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[8496],{35311:function(e,t,s){Promise.resolve().then(s.bind(s,75448))},75448:function(e,t,s){"use strict";s.d(t,{default:function(){return _}});var a=s(57437),r=s(2265),l=s(95452),n=s(70236),i=s(89048),o=s(95186),d=s(62869),c=s(53647),u=s(73247),h=s(39763);let f=(0,h.Z)("ArrowUpNarrowWide",[["path",{d:"m3 8 4-4 4 4",key:"11wl7u"}],["path",{d:"M7 4v16",key:"1glfcx"}],["path",{d:"M11 12h4",key:"q8tih4"}],["path",{d:"M11 16h7",key:"uosisv"}],["path",{d:"M11 20h10",key:"jvxblo"}]]),x=(0,h.Z)("ArrowDownWideNarrow",[["path",{d:"m3 16 4 4 4-4",key:"1co6wj"}],["path",{d:"M7 20V4",key:"1yoxec"}],["path",{d:"M11 4h10",key:"1w87gc"}],["path",{d:"M11 8h7",key:"djye34"}],["path",{d:"M11 12h4",key:"q8tih4"}]]);var m=s(31047),p=s(35974),v=s(66070);function j(e){let{historial:t}=e,[s,l]=(0,r.useState)("todos"),[h,j]=(0,r.useState)(""),[y,g]=(0,r.useState)("desc"),w=t.filter(e=>{var t,a,r;let l="todos"===s||e.estado===s,n=(null===(a=e.servicios)||void 0===a?void 0:null===(t=a.nombre)||void 0===t?void 0:t.toLowerCase().includes(h.toLowerCase()))||(null===(r=e.notas)||void 0===r?void 0:r.toLowerCase().includes(h.toLowerCase()));return l&&n}).sort((e,t)=>{let s=new Date(e.fecha_hora).getTime(),a=new Date(t.fecha_hora).getTime();return"asc"===y?s-a:a-s}),b=e=>{switch(e){case"completada":return"bg-green-100 text-green-800";case"cancelada":return"bg-red-100 text-red-800";case"pendiente":return"bg-yellow-100 text-yellow-800";case"confirmada":return"bg-blue-100 text-blue-800";default:return"bg-gray-100 text-gray-800"}};return(0,a.jsxs)(v.Zb,{children:[(0,a.jsxs)(v.Ol,{children:[(0,a.jsx)(v.ll,{className:"text-2xl font-bold",children:"Historial de Servicios"}),(0,a.jsxs)("div",{className:"flex flex-col sm:flex-row gap-4 mt-4",children:[(0,a.jsxs)("div",{className:"flex-1 relative",children:[(0,a.jsx)(u.Z,{className:"absolute left-2 top-2.5 h-4 w-4 text-muted-foreground"}),(0,a.jsx)(o.I,{placeholder:"Buscar en el historial...",value:h,onChange:e=>j(e.target.value),className:"pl-8"})]}),(0,a.jsxs)(c.Ph,{value:s,onValueChange:l,children:[(0,a.jsx)(c.i4,{className:"w-[180px]",children:(0,a.jsx)(c.ki,{placeholder:"Filtrar por estado"})}),(0,a.jsxs)(c.Bw,{children:[(0,a.jsx)(c.Ql,{value:"todos",children:"Todos los estados"}),(0,a.jsx)(c.Ql,{value:"pendiente",children:"Pendientes"}),(0,a.jsx)(c.Ql,{value:"confirmada",children:"Confirmadas"}),(0,a.jsx)(c.Ql,{value:"completada",children:"Completadas"}),(0,a.jsx)(c.Ql,{value:"cancelada",children:"Canceladas"})]})]}),(0,a.jsx)(d.z,{variant:"outline",onClick:()=>g(e=>"asc"===e?"desc":"asc"),className:"w-[180px]",children:"asc"===y?(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(f,{className:"mr-2 h-4 w-4"})," M\xe1s antiguos primero"]}):(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(x,{className:"mr-2 h-4 w-4"})," M\xe1s recientes primero"]})})]})]}),(0,a.jsx)(v.aY,{children:(0,a.jsxs)("div",{className:"divide-y divide-gray-200",children:[w.map(e=>{var t;return(0,a.jsx)("div",{className:"py-4",children:(0,a.jsx)("div",{className:"flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4",children:(0,a.jsxs)("div",{className:"space-y-1",children:[(0,a.jsxs)("div",{className:"flex items-center gap-2",children:[(0,a.jsx)("p",{className:"font-medium text-lg",children:(null===(t=e.servicios)||void 0===t?void 0:t.nombre)||"Servicio no especificado"}),(0,a.jsx)(p.C,{variant:"outline",className:b(e.estado),children:e.estado})]}),(0,a.jsxs)("div",{className:"flex items-center text-sm text-muted-foreground",children:[(0,a.jsx)(m.Z,{className:"mr-2 h-4 w-4"}),(0,n.Z)(new Date(e.fecha_hora),"PPP 'a las' p",{locale:i.Z})]}),e.notas&&(0,a.jsx)("p",{className:"text-sm text-muted-foreground mt-2",children:e.notas})]})})},e.id_uuid)}),0===w.length&&(0,a.jsx)("div",{className:"text-center py-8 text-muted-foreground",children:0===t.length?"No hay historial disponible":"No se encontraron resultados con los filtros actuales"})]})})]})}var y=s(27648);function g(e){let{items:t}=e;return(0,a.jsx)("nav",{className:"flex space-x-2",children:t.map((e,s)=>(0,a.jsxs)("span",{children:[(0,a.jsx)(y.default,{href:e.href,className:"text-blue-600 hover:underline",children:e.label}),s<t.length-1&&(0,a.jsx)("span",{children:" / "})]},s))})}var w=s(81192),b=s(12339),N=s(94508);async function k(e){try{let t=(0,l.createClientComponentClient)(),{data:s,error:a}=await t.from("citas").select("\n        id_uuid,\n        fecha_hora,\n        estado,\n        notas,\n        servicios!citas_servicio_id_uuid_fkey (\n          id_uuid,\n          nombre\n        )\n      ").eq("cliente_id_uuid",e).order("fecha_hora",{ascending:!1});if(a)throw a;return s||[]}catch(e){return console.error("Error in getClientHistory:",e),[]}}function _(e){let{clientId:t}=e,[s,l]=(0,r.useState)([]),[n,i]=(0,r.useState)(!0);(0,r.useEffect)(()=>{!async function(){l(await k(t)),i(!1)}()},[t]);let o=[{label:"Clientes",href:"".concat((0,N.S)(),"/clientes")},{label:"Historial de Servicios",href:"".concat((0,N.S)(),"/clientes/").concat(t,"/historial")}];return n?(0,a.jsx)("div",{className:"animate-pulse bg-muted h-[200px] rounded-md"}):(0,a.jsxs)("div",{className:"space-y-4",children:[(0,a.jsx)(g,{items:o}),(0,a.jsxs)(b.mQ,{defaultValue:"historial",children:[(0,a.jsxs)(b.dr,{children:[(0,a.jsx)(b.SP,{value:"historial",children:"Historial de Servicios"}),(0,a.jsx)(b.SP,{value:"vehiculos",children:"Veh\xedculos"})]}),(0,a.jsx)(b.nU,{value:"historial",children:(0,a.jsx)(j,{historial:s})}),(0,a.jsx)(b.nU,{value:"vehiculos",children:(0,a.jsx)(w.ClienteVehiculos,{clienteId:t})})]})]})}},95186:function(e,t,s){"use strict";s.d(t,{I:function(){return n}});var a=s(57437),r=s(2265),l=s(94508);let n=r.forwardRef((e,t)=>{let{className:s,type:r,...n}=e;return(0,a.jsx)("input",{type:r,className:(0,l.cn)("flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300",s),ref:t,...n})});n.displayName="Input"},53647:function(e,t,s){"use strict";s.d(t,{Bw:function(){return f},DI:function(){return c},Ph:function(){return d},Ql:function(){return m},i4:function(){return h},ki:function(){return u},n5:function(){return x}});var a=s(57437),r=s(2265),l=s(56873),n=s(40875),i=s(30401),o=s(94508);let d=l.fC,c=l.ZA,u=l.B4,h=r.forwardRef((e,t)=>{let{className:s,children:r,...i}=e;return(0,a.jsxs)(l.xz,{ref:t,className:(0,o.cn)("flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",s),...i,children:[r,(0,a.jsx)(l.JO,{asChild:!0,children:(0,a.jsx)(n.Z,{className:"h-4 w-4 opacity-50"})})]})});h.displayName=l.xz.displayName;let f=r.forwardRef((e,t)=>{let{className:s,children:r,position:n="popper",...i}=e;return(0,a.jsx)(l.h_,{children:(0,a.jsx)(l.VY,{ref:t,className:(0,o.cn)("relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2","popper"===n&&"data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",s),position:n,...i,children:(0,a.jsx)(l.l_,{className:(0,o.cn)("p-1","popper"===n&&"h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"),children:r})})})});f.displayName=l.VY.displayName;let x=r.forwardRef((e,t)=>{let{className:s,...r}=e;return(0,a.jsx)(l.__,{ref:t,className:(0,o.cn)("py-1.5 pl-8 pr-2 text-sm font-semibold",s),...r})});x.displayName=l.__.displayName;let m=r.forwardRef((e,t)=>{let{className:s,children:r,...n}=e;return(0,a.jsxs)(l.ck,{ref:t,className:(0,o.cn)("relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",s),...n,children:[(0,a.jsx)("span",{className:"absolute left-2 flex h-3.5 w-3.5 items-center justify-center",children:(0,a.jsx)(l.wU,{children:(0,a.jsx)(i.Z,{className:"h-4 w-4"})})}),(0,a.jsx)(l.eT,{children:r})]})});m.displayName=l.ck.displayName,r.forwardRef((e,t)=>{let{className:s,...r}=e;return(0,a.jsx)(l.Z0,{ref:t,className:(0,o.cn)("-mx-1 my-1 h-px bg-muted",s),...r})}).displayName=l.Z0.displayName},31047:function(e,t,s){"use strict";s.d(t,{Z:function(){return a}});let a=(0,s(39763).Z)("Calendar",[["rect",{width:"18",height:"18",x:"3",y:"4",rx:"2",ry:"2",key:"eu3xkr"}],["line",{x1:"16",x2:"16",y1:"2",y2:"6",key:"m3sa8f"}],["line",{x1:"8",x2:"8",y1:"2",y2:"6",key:"18kwsl"}],["line",{x1:"3",x2:"21",y1:"10",y2:"10",key:"xt86sb"}]])},73247:function(e,t,s){"use strict";s.d(t,{Z:function(){return a}});let a=(0,s(39763).Z)("Search",[["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}],["path",{d:"m21 21-4.3-4.3",key:"1qie3q"}]])}},function(e){e.O(0,[9903,8325,4384,6008,8001,5452,2130,51,7648,3058,1192,2971,2117,1744],function(){return e(e.s=35311)}),_N_E=e.O()}]);