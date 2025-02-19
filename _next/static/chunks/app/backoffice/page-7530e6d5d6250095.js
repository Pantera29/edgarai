(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[5280],{54855:function(e,t,s){Promise.resolve().then(s.bind(s,10679))},10679:function(e,t,s){"use strict";s.r(t),s.d(t,{default:function(){return b}});var a=s(57437),n=s(2265),r=s(66070),l=s(95452),c=s(47625),i=s(75169),o=s(3574),d=s(20407),u=s(8147),x=s(21156),h=s(56940),f=s(97059),m=s(62994),j=s(54061);let p=["#0088FE","#00C49F","#FFBB28","#FF8042"];function b(){let[e,t]=(0,n.useState)(null),s=(0,l.createClientComponentClient)();(0,n.useEffect)(()=>{b()},[]);let b=async()=>{try{let{count:e}=await s.from("clientes").select("*",{count:"exact"}),{count:a}=await s.from("vehiculos").select("*",{count:"exact"}),{count:n}=await s.from("citas").select("*",{count:"exact"}).eq("estado","pendiente"),r=new Date().toISOString().split("T")[0],{count:l}=await s.from("citas").select("*",{count:"exact"}).gte("fecha_hora",r).lt("fecha_hora",r+"T23:59:59"),{data:c}=await s.from("citas").select("estado, count").select("estado").then(e=>{let{data:t}=e,s={};return null==t||t.forEach(e=>{s[e.estado]=(s[e.estado]||0)+1}),{data:Object.entries(s).map(e=>{let[t,s]=e;return{estado:t,cantidad:s}})}}),{data:i}=await s.from("citas").select("fecha_hora, estado").eq("estado","completada").then(e=>{let{data:t}=e,s={};return null==t||t.forEach(e=>{let t=new Date(e.fecha_hora).toLocaleString("es",{month:"long"});s[t]=(s[t]||0)+Math.floor(4e3*Math.random()+1e3)}),{data:Object.entries(s).map(e=>{let[t,s]=e;return{mes:t,ingresos:s}})}}),o=new Date;o.setHours(0,0,0,0);let d=new Date(o);d.setDate(d.getDate()+4);let{data:u}=await s.from("citas").select("\n          id_uuid,\n          fecha_hora,\n          estado,\n          clientes (\n            nombre\n          ),\n          servicios (\n            nombre\n          )\n        "),x=(null==u?void 0:u.map(e=>({id_uuid:e.id_uuid,fecha_hora:e.fecha_hora,estado:e.estado,cliente:{nombre:e.clientes.nombre||"Error al cargar cliente"},servicios:e.servicios?[{nombre:e.servicios.nombre}]:[]})))||[];t({totalClientes:e||0,totalVehiculos:a||0,citasPendientes:n||0,citasHoy:l||0,serviciosPorEstado:c||[],ingresosMensuales:i||[],proximasCitas:x})}catch(e){console.error("Error cargando datos:",e)}};return e?(0,a.jsxs)("div",{className:"flex-1 space-y-4 p-8 pt-6",children:[(0,a.jsx)("div",{className:"flex items-center justify-between space-y-2",children:(0,a.jsx)("h2",{className:"text-3xl font-bold tracking-tight",children:"Dashboard"})}),(0,a.jsxs)("div",{className:"space-y-4",children:[(0,a.jsxs)("div",{className:"grid gap-4 md:grid-cols-2 lg:grid-cols-4",children:[(0,a.jsxs)(r.Zb,{children:[(0,a.jsx)(r.Ol,{className:"flex flex-row items-center justify-between space-y-0 pb-2",children:(0,a.jsx)(r.ll,{className:"text-sm font-medium",children:"Total Clientes"})}),(0,a.jsx)(r.aY,{children:(0,a.jsx)("div",{className:"text-2xl font-bold",children:e.totalClientes})})]}),(0,a.jsxs)(r.Zb,{children:[(0,a.jsx)(r.Ol,{className:"flex flex-row items-center justify-between space-y-0 pb-2",children:(0,a.jsx)(r.ll,{className:"text-sm font-medium",children:"Veh\xedculos Registrados"})}),(0,a.jsx)(r.aY,{children:(0,a.jsx)("div",{className:"text-2xl font-bold",children:e.totalVehiculos})})]}),(0,a.jsxs)(r.Zb,{children:[(0,a.jsx)(r.Ol,{className:"flex flex-row items-center justify-between space-y-0 pb-2",children:(0,a.jsx)(r.ll,{className:"text-sm font-medium",children:"Citas Pendientes"})}),(0,a.jsx)(r.aY,{children:(0,a.jsx)("div",{className:"text-2xl font-bold",children:e.citasPendientes})})]}),(0,a.jsxs)(r.Zb,{children:[(0,a.jsx)(r.Ol,{className:"flex flex-row items-center justify-between space-y-0 pb-2",children:(0,a.jsx)(r.ll,{className:"text-sm font-medium",children:"Citas Hoy"})}),(0,a.jsx)(r.aY,{children:(0,a.jsx)("div",{className:"text-2xl font-bold",children:e.citasHoy})})]})]}),(0,a.jsxs)("div",{className:"grid gap-4 md:grid-cols-2",children:[(0,a.jsxs)(r.Zb,{className:"col-span-1",children:[(0,a.jsx)(r.Ol,{children:(0,a.jsx)(r.ll,{children:"Servicios por Estado"})}),(0,a.jsx)(r.aY,{className:"pl-2",children:(0,a.jsx)(c.h,{width:"100%",height:300,children:(0,a.jsxs)(i.u,{children:[(0,a.jsx)(o.b,{data:e.serviciosPorEstado,cx:"50%",cy:"50%",labelLine:!1,label:e=>{let{name:t,percent:s}=e;return"".concat(t," (").concat((100*s).toFixed(0),"%)")},outerRadius:80,fill:"#8884d8",dataKey:"cantidad",children:e.serviciosPorEstado.map((e,t)=>(0,a.jsx)(d.b,{fill:p[t%p.length]},"cell-".concat(t)))}),(0,a.jsx)(u.u,{})]})})})]}),(0,a.jsxs)(r.Zb,{className:"col-span-1",children:[(0,a.jsx)(r.Ol,{children:(0,a.jsx)(r.ll,{children:"Ingresos Mensuales"})}),(0,a.jsx)(r.aY,{children:(0,a.jsx)(c.h,{width:"100%",height:300,children:(0,a.jsxs)(x.w,{data:e.ingresosMensuales,children:[(0,a.jsx)(h.q,{strokeDasharray:"3 3"}),(0,a.jsx)(f.K,{dataKey:"mes"}),(0,a.jsx)(m.B,{}),(0,a.jsx)(u.u,{}),(0,a.jsx)(j.x,{type:"monotone",dataKey:"ingresos",stroke:"#8884d8"})]})})})]})]})]})]}):(0,a.jsx)("div",{children:"Cargando..."})}},66070:function(e,t,s){"use strict";s.d(t,{Ol:function(){return c},Zb:function(){return l},aY:function(){return o},ll:function(){return i}});var a=s(57437),n=s(2265),r=s(94508);let l=n.forwardRef((e,t)=>{let{className:s,...n}=e;return(0,a.jsx)("div",{ref:t,className:(0,r.cn)("rounded-xl border bg-card text-card-foreground shadow",s),...n})});l.displayName="Card";let c=n.forwardRef((e,t)=>{let{className:s,...n}=e;return(0,a.jsx)("div",{ref:t,className:(0,r.cn)("flex flex-col space-y-1.5 p-6",s),...n})});c.displayName="CardHeader";let i=n.forwardRef((e,t)=>{let{className:s,...n}=e;return(0,a.jsx)("h3",{ref:t,className:(0,r.cn)("font-semibold leading-none tracking-tight",s),...n})});i.displayName="CardTitle",n.forwardRef((e,t)=>{let{className:s,...n}=e;return(0,a.jsx)("p",{ref:t,className:(0,r.cn)("text-sm text-muted-foreground",s),...n})}).displayName="CardDescription";let o=n.forwardRef((e,t)=>{let{className:s,...n}=e;return(0,a.jsx)("div",{ref:t,className:(0,r.cn)("p-6 pt-0",s),...n})});o.displayName="CardContent"},94508:function(e,t,s){"use strict";s.d(t,{S:function(){return l},cn:function(){return r}});var a=s(61994),n=s(53335);function r(){for(var e=arguments.length,t=Array(e),s=0;s<e;s++)t[s]=arguments[s];return(0,n.m6)((0,a.W)(t))}function l(){return"/edgarai"}}},function(e){e.O(0,[6137,3777,5452,276,5098,9636,2971,2117,1744],function(){return e(e.s=54855)}),_N_E=e.O()}]);