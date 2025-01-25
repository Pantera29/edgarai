"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[1192],{81192:function(e,r,t){t.d(r,{ClienteVehiculos:function(){return p}});var s=t(57437),a=t(2265),n=t(95452),i=t(70236),l=t(89048),o=t(12339),c=t(66070),d=t(35974),u=t(62869),f=t(73578),m=t(57662),x=t(29525),h=t(94766);function p(e){let{clienteId:r}=e,[t,p]=(0,a.useState)([]),[j,g]=(0,a.useState)([]),[v,b]=(0,a.useState)([]),[N,y]=(0,a.useState)(!0),[w,_]=(0,a.useState)(null),[C,Z]=(0,a.useState)([]),R=(0,n.createClientComponentClient)(),S=(0,a.useCallback)(async()=>{y(!0);try{let{data:e,error:t}=await R.from("vehiculos").select("*").eq("id_cliente_uuid",r);if(t)throw t;p(e||[]),(null==e?void 0:e.length)>0&&_(e[0].id_uuid);let{data:s,error:a}=await R.from("historial_propietarios").select("\n          *,\n          cliente:clientes(nombre)\n        ").eq("id_vehiculo",w).order("fecha_inicio",{ascending:!1});if(a)throw a;Z(s||[])}catch(e){console.error("Error cargando datos:",e)}finally{y(!1)}},[r,w,R]);(0,a.useEffect)(()=>{S()},[S]);let k=e=>e.fecha_vencimiento_garantia?new Date>new Date(e.fecha_vencimiento_garantia)?"Vencida":"Vigente":"Sin garant\xeda";return N?(0,s.jsxs)("div",{className:"animate-pulse space-y-4",children:[(0,s.jsx)("div",{className:"h-4 bg-muted rounded w-1/4"}),(0,s.jsx)("div",{className:"h-32 bg-muted rounded"})]}):(0,s.jsx)("div",{className:"space-y-6",children:0===t.length?(0,s.jsx)(c.Zb,{children:(0,s.jsx)(c.aY,{className:"pt-6",children:(0,s.jsxs)("div",{className:"text-center space-y-4",children:[(0,s.jsx)(m.Z,{className:"mx-auto h-12 w-12 text-muted-foreground"}),(0,s.jsxs)("div",{className:"space-y-2",children:[(0,s.jsx)("h3",{className:"text-lg font-medium",children:"No hay veh\xedculos registrados"}),(0,s.jsx)("p",{className:"text-sm text-muted-foreground",children:"Este cliente a\xfan no tiene veh\xedculos registrados."})]}),(0,s.jsx)(u.z,{children:"Agregar Veh\xedculo"})]})})}):(0,s.jsxs)(o.mQ,{defaultValue:"info",className:"space-y-4",children:[(0,s.jsxs)(o.dr,{children:[(0,s.jsxs)(o.SP,{value:"info",children:[(0,s.jsx)(m.Z,{className:"h-4 w-4 mr-2"}),"Informaci\xf3n"]}),(0,s.jsxs)(o.SP,{value:"historial",children:[(0,s.jsx)(x.Z,{className:"h-4 w-4 mr-2"}),"Historial"]}),(0,s.jsxs)(o.SP,{value:"modificaciones",children:[(0,s.jsx)(x.Z,{className:"h-4 w-4 mr-2"}),"Modificaciones"]}),(0,s.jsxs)(o.SP,{value:"alertas",children:[(0,s.jsx)(h.Z,{className:"h-4 w-4 mr-2"}),"Alertas"]})]}),(0,s.jsx)(o.nU,{value:"info",className:"space-y-4",children:(0,s.jsx)("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4",children:t.map(e=>(0,s.jsxs)(c.Zb,{children:[(0,s.jsx)(c.Ol,{children:(0,s.jsxs)(c.ll,{className:"flex items-center justify-between",children:[(0,s.jsxs)("span",{children:[e.marca," ",e.modelo," ",e.anio]}),(0,s.jsx)(d.C,{variant:"vigente"===e.estado_garantia?"success":"destructive",children:k(e)})]})}),(0,s.jsx)(c.aY,{children:(0,s.jsxs)("div",{className:"grid grid-cols-2 gap-4",children:[(0,s.jsxs)("div",{children:[(0,s.jsx)("p",{className:"text-sm font-medium",children:"VIN"}),(0,s.jsx)("p",{className:"text-sm text-muted-foreground",children:e.vin||"No registrado"})]}),(0,s.jsxs)("div",{children:[(0,s.jsx)("p",{className:"text-sm font-medium",children:"Placa"}),(0,s.jsx)("p",{className:"text-sm text-muted-foreground",children:e.placa||"No registrada"})]}),(0,s.jsxs)("div",{children:[(0,s.jsx)("p",{className:"text-sm font-medium",children:"Color"}),(0,s.jsx)("p",{className:"text-sm text-muted-foreground",children:e.color||"No especificado"})]}),(0,s.jsxs)("div",{children:[(0,s.jsx)("p",{className:"text-sm font-medium",children:"Kilometraje"}),(0,s.jsx)("p",{className:"text-sm text-muted-foreground",children:e.kilometraje_actual?"".concat(e.kilometraje_actual," km"):"No registrado"})]}),(0,s.jsxs)("div",{children:[(0,s.jsx)("p",{className:"text-sm font-medium",children:"\xdaltimo servicio"}),(0,s.jsx)("p",{className:"text-sm text-muted-foreground",children:e.fecha_ultimo_servicio?(0,i.Z)(new Date(e.fecha_ultimo_servicio),"PP",{locale:l.Z}):"Sin servicios"})]}),(0,s.jsxs)("div",{children:[(0,s.jsx)("p",{className:"text-sm font-medium",children:"Pr\xf3ximo servicio"}),(0,s.jsx)("p",{className:"text-sm text-muted-foreground",children:e.fecha_proximo_servicio?(0,i.Z)(new Date(e.fecha_proximo_servicio),"PP",{locale:l.Z}):"No programado"})]})]})})]},e.id_uuid))})}),(0,s.jsx)(o.nU,{value:"historial",children:(0,s.jsxs)(c.Zb,{children:[(0,s.jsx)(c.Ol,{children:(0,s.jsx)(c.ll,{children:"Historial de Propietarios"})}),(0,s.jsx)(c.aY,{children:(0,s.jsxs)(f.iA,{children:[(0,s.jsx)(f.xD,{children:(0,s.jsxs)(f.SC,{children:[(0,s.jsx)(f.ss,{children:"Propietario"}),(0,s.jsx)(f.ss,{children:"Fecha Inicio"}),(0,s.jsx)(f.ss,{children:"Fecha Fin"}),(0,s.jsx)(f.ss,{children:"Notas"})]})}),(0,s.jsxs)(f.RM,{children:[C.map(e=>(0,s.jsxs)(f.SC,{children:[(0,s.jsx)(f.pj,{children:e.cliente.nombre}),(0,s.jsx)(f.pj,{children:(0,i.Z)(new Date(e.fecha_inicio),"PP",{locale:l.Z})}),(0,s.jsx)(f.pj,{children:e.fecha_fin?(0,i.Z)(new Date(e.fecha_fin),"PP",{locale:l.Z}):"Propietario actual"}),(0,s.jsx)(f.pj,{children:e.notas_transferencia||"-"})]},e.id_uuid)),0===C.length&&(0,s.jsx)(f.SC,{children:(0,s.jsx)(f.pj,{colSpan:4,className:"text-center py-4",children:"No hay registros de propietarios anteriores"})})]})]})})]})}),(0,s.jsx)(o.nU,{value:"modificaciones",children:(0,s.jsxs)(c.Zb,{children:[(0,s.jsx)(c.Ol,{children:(0,s.jsx)(c.ll,{children:"Registro de Modificaciones"})}),(0,s.jsx)(c.aY,{children:(0,s.jsxs)("div",{className:"text-center py-8 text-muted-foreground",children:[(0,s.jsx)(x.Z,{className:"mx-auto h-12 w-12 mb-4"}),(0,s.jsx)("p",{children:"El registro de modificaciones estar\xe1 disponible pr\xf3ximamente"})]})})]})}),(0,s.jsx)(o.nU,{value:"alertas",children:(0,s.jsxs)(c.Zb,{children:[(0,s.jsx)(c.Ol,{children:(0,s.jsx)(c.ll,{children:"Alertas y Notificaciones"})}),(0,s.jsx)(c.aY,{children:(0,s.jsx)("div",{className:"space-y-4",children:(0,s.jsxs)("div",{className:"text-center py-8 text-muted-foreground",children:[(0,s.jsx)(h.Z,{className:"mx-auto h-12 w-12 mb-4"}),(0,s.jsx)("p",{children:"Las alertas y notificaciones estar\xe1n disponibles pr\xf3ximamente"})]})})})]})})]})})}},35974:function(e,r,t){t.d(r,{C:function(){return l}});var s=t(57437);t(2265);var a=t(90535),n=t(94508);let i=(0,a.j)("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",{variants:{variant:{default:"border-transparent bg-primary text-primary-foreground",secondary:"border-transparent bg-secondary text-secondary-foreground",destructive:"border-transparent bg-destructive text-destructive-foreground",outline:"text-foreground",success:"border-transparent bg-green-100 text-green-800",warning:"border-transparent bg-yellow-100 text-yellow-800",info:"border-transparent bg-blue-100 text-blue-800"}},defaultVariants:{variant:"default"}});function l(e){let{className:r,variant:t,...a}=e;return(0,s.jsx)("div",{className:(0,n.cn)(i({variant:t}),r),...a})}},62869:function(e,r,t){t.d(r,{d:function(){return o},z:function(){return c}});var s=t(57437),a=t(2265),n=t(37053),i=t(90535),l=t(94508);let o=(0,i.j)("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",{variants:{variant:{default:"bg-primary text-primary-foreground shadow hover:bg-primary/90",destructive:"bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",outline:"border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",secondary:"bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",ghost:"hover:bg-accent hover:text-accent-foreground",link:"text-primary underline-offset-4 hover:underline"},size:{default:"h-9 px-4 py-2",sm:"h-8 rounded-md px-3 text-xs",lg:"h-10 rounded-md px-8",icon:"h-9 w-9"}},defaultVariants:{variant:"default",size:"default"}}),c=a.forwardRef((e,r)=>{let{className:t,variant:a,size:i,asChild:c=!1,...d}=e,u=c?n.g7:"button";return(0,s.jsx)(u,{className:(0,l.cn)(o({variant:a,size:i,className:t})),ref:r,...d})});c.displayName="Button"},66070:function(e,r,t){t.d(r,{Ol:function(){return l},SZ:function(){return c},Zb:function(){return i},aY:function(){return d},ll:function(){return o}});var s=t(57437),a=t(2265),n=t(94508);let i=a.forwardRef((e,r)=>{let{className:t,...a}=e;return(0,s.jsx)("div",{ref:r,className:(0,n.cn)("rounded-xl border bg-card text-card-foreground shadow",t),...a})});i.displayName="Card";let l=a.forwardRef((e,r)=>{let{className:t,...a}=e;return(0,s.jsx)("div",{ref:r,className:(0,n.cn)("flex flex-col space-y-1.5 p-6",t),...a})});l.displayName="CardHeader";let o=a.forwardRef((e,r)=>{let{className:t,...a}=e;return(0,s.jsx)("h3",{ref:r,className:(0,n.cn)("font-semibold leading-none tracking-tight",t),...a})});o.displayName="CardTitle";let c=a.forwardRef((e,r)=>{let{className:t,...a}=e;return(0,s.jsx)("p",{ref:r,className:(0,n.cn)("text-sm text-muted-foreground",t),...a})});c.displayName="CardDescription";let d=a.forwardRef((e,r)=>{let{className:t,...a}=e;return(0,s.jsx)("div",{ref:r,className:(0,n.cn)("p-6 pt-0",t),...a})});d.displayName="CardContent"},73578:function(e,r,t){t.d(r,{RM:function(){return o},SC:function(){return c},iA:function(){return i},pj:function(){return u},ss:function(){return d},xD:function(){return l}});var s=t(57437),a=t(2265),n=t(94508);let i=a.forwardRef((e,r)=>{let{className:t,...a}=e;return(0,s.jsx)("div",{className:"relative w-full overflow-auto",children:(0,s.jsx)("table",{ref:r,className:(0,n.cn)("w-full caption-bottom text-sm",t),...a})})});i.displayName="Table";let l=a.forwardRef((e,r)=>{let{className:t,...a}=e;return(0,s.jsx)("thead",{ref:r,className:(0,n.cn)("[&_tr]:border-b",t),...a})});l.displayName="TableHeader";let o=a.forwardRef((e,r)=>{let{className:t,...a}=e;return(0,s.jsx)("tbody",{ref:r,className:(0,n.cn)("[&_tr:last-child]:border-0",t),...a})});o.displayName="TableBody",a.forwardRef((e,r)=>{let{className:t,...a}=e;return(0,s.jsx)("tfoot",{ref:r,className:(0,n.cn)("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",t),...a})}).displayName="TableFooter";let c=a.forwardRef((e,r)=>{let{className:t,...a}=e;return(0,s.jsx)("tr",{ref:r,className:(0,n.cn)("border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",t),...a})});c.displayName="TableRow";let d=a.forwardRef((e,r)=>{let{className:t,...a}=e;return(0,s.jsx)("th",{ref:r,className:(0,n.cn)("h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",t),...a})});d.displayName="TableHead";let u=a.forwardRef((e,r)=>{let{className:t,...a}=e;return(0,s.jsx)("td",{ref:r,className:(0,n.cn)("p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",t),...a})});u.displayName="TableCell",a.forwardRef((e,r)=>{let{className:t,...a}=e;return(0,s.jsx)("caption",{ref:r,className:(0,n.cn)("mt-4 text-sm text-muted-foreground",t),...a})}).displayName="TableCaption"},12339:function(e,r,t){t.d(r,{SP:function(){return c},dr:function(){return o},mQ:function(){return l},nU:function(){return d}});var s=t(57437),a=t(2265),n=t(20271),i=t(94508);let l=n.fC,o=a.forwardRef((e,r)=>{let{className:t,...a}=e;return(0,s.jsx)(n.aV,{ref:r,className:(0,i.cn)("inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",t),...a})});o.displayName=n.aV.displayName;let c=a.forwardRef((e,r)=>{let{className:t,...a}=e;return(0,s.jsx)(n.xz,{ref:r,className:(0,i.cn)("inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",t),...a})});c.displayName=n.xz.displayName;let d=a.forwardRef((e,r)=>{let{className:t,...a}=e;return(0,s.jsx)(n.VY,{ref:r,className:(0,i.cn)("mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",t),...a})});d.displayName=n.VY.displayName},94508:function(e,r,t){t.d(r,{S:function(){return i},cn:function(){return n}});var s=t(61994),a=t(53335);function n(){for(var e=arguments.length,r=Array(e),t=0;t<e;t++)r[t]=arguments[t];return(0,a.m6)((0,s.W)(r))}function i(){return"/edgarai"}}}]);