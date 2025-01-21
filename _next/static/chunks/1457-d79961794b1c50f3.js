"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[1457],{61457:function(e,r,t){t.d(r,{ClienteVehiculos:function(){return p}});var a=t(57437),n=t(2265),s=t(95452),i=t(70236),o=t(89048),l=t(12339),c=t(66070),d=t(35974),u=t(62869),f=t(73578),m=t(57662),x=t(29525);let h=(0,t(39763).Z)("Bell",[["path",{d:"M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9",key:"1qo2s2"}],["path",{d:"M10.3 21a1.94 1.94 0 0 0 3.4 0",key:"qgo35s"}]]);function p(e){let{clienteId:r}=e,[t,p]=(0,n.useState)([]),[j,g]=(0,n.useState)([]),[v,b]=(0,n.useState)([]),[N,y]=(0,n.useState)(!0),[w,_]=(0,n.useState)(null),[C,k]=(0,n.useState)([]),R=(0,s.createClientComponentClient)(),Z=(0,n.useCallback)(async()=>{y(!0);try{let{data:e,error:t}=await R.from("vehiculos").select("*").eq("id_cliente_uuid",r);if(t)throw t;p(e||[]),(null==e?void 0:e.length)>0&&_(e[0].id_uuid);let{data:a,error:n}=await R.from("historial_propietarios").select("\n          *,\n          cliente:clientes(nombre)\n        ").eq("id_vehiculo",w).order("fecha_inicio",{ascending:!1});if(n)throw n;k(a||[])}catch(e){console.error("Error cargando datos:",e)}finally{y(!1)}},[r,w,R]);(0,n.useEffect)(()=>{Z()},[Z]);let V=e=>e.fecha_vencimiento_garantia?new Date>new Date(e.fecha_vencimiento_garantia)?"Vencida":"Vigente":"Sin garant\xeda";return N?(0,a.jsxs)("div",{className:"animate-pulse space-y-4",children:[(0,a.jsx)("div",{className:"h-4 bg-muted rounded w-1/4"}),(0,a.jsx)("div",{className:"h-32 bg-muted rounded"})]}):(0,a.jsx)("div",{className:"space-y-6",children:0===t.length?(0,a.jsx)(c.Zb,{children:(0,a.jsx)(c.aY,{className:"pt-6",children:(0,a.jsxs)("div",{className:"text-center space-y-4",children:[(0,a.jsx)(m.Z,{className:"mx-auto h-12 w-12 text-muted-foreground"}),(0,a.jsxs)("div",{className:"space-y-2",children:[(0,a.jsx)("h3",{className:"text-lg font-medium",children:"No hay veh\xedculos registrados"}),(0,a.jsx)("p",{className:"text-sm text-muted-foreground",children:"Este cliente a\xfan no tiene veh\xedculos registrados."})]}),(0,a.jsx)(u.z,{children:"Agregar Veh\xedculo"})]})})}):(0,a.jsxs)(l.mQ,{defaultValue:"info",className:"space-y-4",children:[(0,a.jsxs)(l.dr,{children:[(0,a.jsxs)(l.SP,{value:"info",children:[(0,a.jsx)(m.Z,{className:"h-4 w-4 mr-2"}),"Informaci\xf3n"]}),(0,a.jsxs)(l.SP,{value:"historial",children:[(0,a.jsx)(x.Z,{className:"h-4 w-4 mr-2"}),"Historial"]}),(0,a.jsxs)(l.SP,{value:"modificaciones",children:[(0,a.jsx)(x.Z,{className:"h-4 w-4 mr-2"}),"Modificaciones"]}),(0,a.jsxs)(l.SP,{value:"alertas",children:[(0,a.jsx)(h,{className:"h-4 w-4 mr-2"}),"Alertas"]})]}),(0,a.jsx)(l.nU,{value:"info",className:"space-y-4",children:(0,a.jsx)("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4",children:t.map(e=>(0,a.jsxs)(c.Zb,{children:[(0,a.jsx)(c.Ol,{children:(0,a.jsxs)(c.ll,{className:"flex items-center justify-between",children:[(0,a.jsxs)("span",{children:[e.marca," ",e.modelo," ",e.anio]}),(0,a.jsx)(d.C,{variant:"vigente"===e.estado_garantia?"success":"destructive",children:V(e)})]})}),(0,a.jsx)(c.aY,{children:(0,a.jsxs)("div",{className:"grid grid-cols-2 gap-4",children:[(0,a.jsxs)("div",{children:[(0,a.jsx)("p",{className:"text-sm font-medium",children:"VIN"}),(0,a.jsx)("p",{className:"text-sm text-muted-foreground",children:e.vin||"No registrado"})]}),(0,a.jsxs)("div",{children:[(0,a.jsx)("p",{className:"text-sm font-medium",children:"Placa"}),(0,a.jsx)("p",{className:"text-sm text-muted-foreground",children:e.placa||"No registrada"})]}),(0,a.jsxs)("div",{children:[(0,a.jsx)("p",{className:"text-sm font-medium",children:"Color"}),(0,a.jsx)("p",{className:"text-sm text-muted-foreground",children:e.color||"No especificado"})]}),(0,a.jsxs)("div",{children:[(0,a.jsx)("p",{className:"text-sm font-medium",children:"Kilometraje"}),(0,a.jsx)("p",{className:"text-sm text-muted-foreground",children:e.kilometraje_actual?"".concat(e.kilometraje_actual," km"):"No registrado"})]}),(0,a.jsxs)("div",{children:[(0,a.jsx)("p",{className:"text-sm font-medium",children:"\xdaltimo servicio"}),(0,a.jsx)("p",{className:"text-sm text-muted-foreground",children:e.fecha_ultimo_servicio?(0,i.Z)(new Date(e.fecha_ultimo_servicio),"PP",{locale:o.Z}):"Sin servicios"})]}),(0,a.jsxs)("div",{children:[(0,a.jsx)("p",{className:"text-sm font-medium",children:"Pr\xf3ximo servicio"}),(0,a.jsx)("p",{className:"text-sm text-muted-foreground",children:e.fecha_proximo_servicio?(0,i.Z)(new Date(e.fecha_proximo_servicio),"PP",{locale:o.Z}):"No programado"})]})]})})]},e.id_uuid))})}),(0,a.jsx)(l.nU,{value:"historial",children:(0,a.jsxs)(c.Zb,{children:[(0,a.jsx)(c.Ol,{children:(0,a.jsx)(c.ll,{children:"Historial de Propietarios"})}),(0,a.jsx)(c.aY,{children:(0,a.jsxs)(f.iA,{children:[(0,a.jsx)(f.xD,{children:(0,a.jsxs)(f.SC,{children:[(0,a.jsx)(f.ss,{children:"Propietario"}),(0,a.jsx)(f.ss,{children:"Fecha Inicio"}),(0,a.jsx)(f.ss,{children:"Fecha Fin"}),(0,a.jsx)(f.ss,{children:"Notas"})]})}),(0,a.jsxs)(f.RM,{children:[C.map(e=>(0,a.jsxs)(f.SC,{children:[(0,a.jsx)(f.pj,{children:e.cliente.nombre}),(0,a.jsx)(f.pj,{children:(0,i.Z)(new Date(e.fecha_inicio),"PP",{locale:o.Z})}),(0,a.jsx)(f.pj,{children:e.fecha_fin?(0,i.Z)(new Date(e.fecha_fin),"PP",{locale:o.Z}):"Propietario actual"}),(0,a.jsx)(f.pj,{children:e.notas_transferencia||"-"})]},e.id_uuid)),0===C.length&&(0,a.jsx)(f.SC,{children:(0,a.jsx)(f.pj,{colSpan:4,className:"text-center py-4",children:"No hay registros de propietarios anteriores"})})]})]})})]})}),(0,a.jsx)(l.nU,{value:"modificaciones",children:(0,a.jsxs)(c.Zb,{children:[(0,a.jsx)(c.Ol,{children:(0,a.jsx)(c.ll,{children:"Registro de Modificaciones"})}),(0,a.jsx)(c.aY,{children:(0,a.jsxs)("div",{className:"text-center py-8 text-muted-foreground",children:[(0,a.jsx)(x.Z,{className:"mx-auto h-12 w-12 mb-4"}),(0,a.jsx)("p",{children:"El registro de modificaciones estar\xe1 disponible pr\xf3ximamente"})]})})]})}),(0,a.jsx)(l.nU,{value:"alertas",children:(0,a.jsxs)(c.Zb,{children:[(0,a.jsx)(c.Ol,{children:(0,a.jsx)(c.ll,{children:"Alertas y Notificaciones"})}),(0,a.jsx)(c.aY,{children:(0,a.jsx)("div",{className:"space-y-4",children:(0,a.jsxs)("div",{className:"text-center py-8 text-muted-foreground",children:[(0,a.jsx)(h,{className:"mx-auto h-12 w-12 mb-4"}),(0,a.jsx)("p",{children:"Las alertas y notificaciones estar\xe1n disponibles pr\xf3ximamente"})]})})})]})})]})})}},35974:function(e,r,t){t.d(r,{C:function(){return o}});var a=t(57437);t(2265);var n=t(90535),s=t(94508);let i=(0,n.j)("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",{variants:{variant:{default:"border-transparent bg-primary text-primary-foreground",secondary:"border-transparent bg-secondary text-secondary-foreground",destructive:"border-transparent bg-destructive text-destructive-foreground",outline:"text-foreground",success:"border-transparent bg-green-100 text-green-800",warning:"border-transparent bg-yellow-100 text-yellow-800",info:"border-transparent bg-blue-100 text-blue-800"}},defaultVariants:{variant:"default"}});function o(e){let{className:r,variant:t,...n}=e;return(0,a.jsx)("div",{className:(0,s.cn)(i({variant:t}),r),...n})}},62869:function(e,r,t){t.d(r,{d:function(){return l},z:function(){return c}});var a=t(57437),n=t(2265),s=t(37053),i=t(90535),o=t(94508);let l=(0,i.j)("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",{variants:{variant:{default:"bg-primary text-primary-foreground shadow hover:bg-primary/90",destructive:"bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",outline:"border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",secondary:"bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",ghost:"hover:bg-accent hover:text-accent-foreground",link:"text-primary underline-offset-4 hover:underline"},size:{default:"h-9 px-4 py-2",sm:"h-8 rounded-md px-3 text-xs",lg:"h-10 rounded-md px-8",icon:"h-9 w-9"}},defaultVariants:{variant:"default",size:"default"}}),c=n.forwardRef((e,r)=>{let{className:t,variant:n,size:i,asChild:c=!1,...d}=e,u=c?s.g7:"button";return(0,a.jsx)(u,{className:(0,o.cn)(l({variant:n,size:i,className:t})),ref:r,...d})});c.displayName="Button"},66070:function(e,r,t){t.d(r,{Ol:function(){return o},SZ:function(){return c},Zb:function(){return i},aY:function(){return d},ll:function(){return l}});var a=t(57437),n=t(2265),s=t(94508);let i=n.forwardRef((e,r)=>{let{className:t,...n}=e;return(0,a.jsx)("div",{ref:r,className:(0,s.cn)("rounded-xl border bg-card text-card-foreground shadow",t),...n})});i.displayName="Card";let o=n.forwardRef((e,r)=>{let{className:t,...n}=e;return(0,a.jsx)("div",{ref:r,className:(0,s.cn)("flex flex-col space-y-1.5 p-6",t),...n})});o.displayName="CardHeader";let l=n.forwardRef((e,r)=>{let{className:t,...n}=e;return(0,a.jsx)("h3",{ref:r,className:(0,s.cn)("font-semibold leading-none tracking-tight",t),...n})});l.displayName="CardTitle";let c=n.forwardRef((e,r)=>{let{className:t,...n}=e;return(0,a.jsx)("p",{ref:r,className:(0,s.cn)("text-sm text-muted-foreground",t),...n})});c.displayName="CardDescription";let d=n.forwardRef((e,r)=>{let{className:t,...n}=e;return(0,a.jsx)("div",{ref:r,className:(0,s.cn)("p-6 pt-0",t),...n})});d.displayName="CardContent"},73578:function(e,r,t){t.d(r,{RM:function(){return l},SC:function(){return c},iA:function(){return i},pj:function(){return u},ss:function(){return d},xD:function(){return o}});var a=t(57437),n=t(2265),s=t(94508);let i=n.forwardRef((e,r)=>{let{className:t,...n}=e;return(0,a.jsx)("div",{className:"relative w-full overflow-auto",children:(0,a.jsx)("table",{ref:r,className:(0,s.cn)("w-full caption-bottom text-sm",t),...n})})});i.displayName="Table";let o=n.forwardRef((e,r)=>{let{className:t,...n}=e;return(0,a.jsx)("thead",{ref:r,className:(0,s.cn)("[&_tr]:border-b",t),...n})});o.displayName="TableHeader";let l=n.forwardRef((e,r)=>{let{className:t,...n}=e;return(0,a.jsx)("tbody",{ref:r,className:(0,s.cn)("[&_tr:last-child]:border-0",t),...n})});l.displayName="TableBody",n.forwardRef((e,r)=>{let{className:t,...n}=e;return(0,a.jsx)("tfoot",{ref:r,className:(0,s.cn)("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",t),...n})}).displayName="TableFooter";let c=n.forwardRef((e,r)=>{let{className:t,...n}=e;return(0,a.jsx)("tr",{ref:r,className:(0,s.cn)("border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",t),...n})});c.displayName="TableRow";let d=n.forwardRef((e,r)=>{let{className:t,...n}=e;return(0,a.jsx)("th",{ref:r,className:(0,s.cn)("h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",t),...n})});d.displayName="TableHead";let u=n.forwardRef((e,r)=>{let{className:t,...n}=e;return(0,a.jsx)("td",{ref:r,className:(0,s.cn)("p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",t),...n})});u.displayName="TableCell",n.forwardRef((e,r)=>{let{className:t,...n}=e;return(0,a.jsx)("caption",{ref:r,className:(0,s.cn)("mt-4 text-sm text-muted-foreground",t),...n})}).displayName="TableCaption"},12339:function(e,r,t){t.d(r,{SP:function(){return c},dr:function(){return l},mQ:function(){return o},nU:function(){return d}});var a=t(57437),n=t(2265),s=t(20271),i=t(94508);let o=s.fC,l=n.forwardRef((e,r)=>{let{className:t,...n}=e;return(0,a.jsx)(s.aV,{ref:r,className:(0,i.cn)("inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",t),...n})});l.displayName=s.aV.displayName;let c=n.forwardRef((e,r)=>{let{className:t,...n}=e;return(0,a.jsx)(s.xz,{ref:r,className:(0,i.cn)("inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",t),...n})});c.displayName=s.xz.displayName;let d=n.forwardRef((e,r)=>{let{className:t,...n}=e;return(0,a.jsx)(s.VY,{ref:r,className:(0,i.cn)("mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",t),...n})});d.displayName=s.VY.displayName},94508:function(e,r,t){t.d(r,{S:function(){return i},cn:function(){return s}});var a=t(61994),n=t(53335);function s(){for(var e=arguments.length,r=Array(e),t=0;t<e;t++)r[t]=arguments[t];return(0,n.m6)((0,a.W)(r))}function i(){return"/edgarai"}},57662:function(e,r,t){t.d(r,{Z:function(){return a}});let a=(0,t(39763).Z)("Car",[["path",{d:"M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2",key:"5owen"}],["circle",{cx:"7",cy:"17",r:"2",key:"u2ysq9"}],["path",{d:"M9 17h6",key:"r8uit2"}],["circle",{cx:"17",cy:"17",r:"2",key:"axvx0g"}]])},29525:function(e,r,t){t.d(r,{Z:function(){return a}});let a=(0,t(39763).Z)("Wrench",[["path",{d:"M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z",key:"cbrjhi"}]])},20271:function(e,r,t){t.d(r,{VY:function(){return S},aV:function(){return V},fC:function(){return Z},xz:function(){return P}});var a=t(2265),n=t(6741),s=t(73966),i=t(1353),o=t(71599),l=t(66840),c=t(29114),d=t(80886),u=t(99255),f=t(57437),m="Tabs",[x,h]=(0,s.b)(m,[i.Pc]),p=(0,i.Pc)(),[j,g]=x(m),v=a.forwardRef((e,r)=>{let{__scopeTabs:t,value:a,onValueChange:n,defaultValue:s,orientation:i="horizontal",dir:o,activationMode:m="automatic",...x}=e,h=(0,c.gm)(o),[p,g]=(0,d.T)({prop:a,onChange:n,defaultProp:s});return(0,f.jsx)(j,{scope:t,baseId:(0,u.M)(),value:p,onValueChange:g,orientation:i,dir:h,activationMode:m,children:(0,f.jsx)(l.WV.div,{dir:h,"data-orientation":i,...x,ref:r})})});v.displayName=m;var b="TabsList",N=a.forwardRef((e,r)=>{let{__scopeTabs:t,loop:a=!0,...n}=e,s=g(b,t),o=p(t);return(0,f.jsx)(i.fC,{asChild:!0,...o,orientation:s.orientation,dir:s.dir,loop:a,children:(0,f.jsx)(l.WV.div,{role:"tablist","aria-orientation":s.orientation,...n,ref:r})})});N.displayName=b;var y="TabsTrigger",w=a.forwardRef((e,r)=>{let{__scopeTabs:t,value:a,disabled:s=!1,...o}=e,c=g(y,t),d=p(t),u=k(c.baseId,a),m=R(c.baseId,a),x=a===c.value;return(0,f.jsx)(i.ck,{asChild:!0,...d,focusable:!s,active:x,children:(0,f.jsx)(l.WV.button,{type:"button",role:"tab","aria-selected":x,"aria-controls":m,"data-state":x?"active":"inactive","data-disabled":s?"":void 0,disabled:s,id:u,...o,ref:r,onMouseDown:(0,n.M)(e.onMouseDown,e=>{s||0!==e.button||!1!==e.ctrlKey?e.preventDefault():c.onValueChange(a)}),onKeyDown:(0,n.M)(e.onKeyDown,e=>{[" ","Enter"].includes(e.key)&&c.onValueChange(a)}),onFocus:(0,n.M)(e.onFocus,()=>{let e="manual"!==c.activationMode;x||s||!e||c.onValueChange(a)})})})});w.displayName=y;var _="TabsContent",C=a.forwardRef((e,r)=>{let{__scopeTabs:t,value:n,forceMount:s,children:i,...c}=e,d=g(_,t),u=k(d.baseId,n),m=R(d.baseId,n),x=n===d.value,h=a.useRef(x);return a.useEffect(()=>{let e=requestAnimationFrame(()=>h.current=!1);return()=>cancelAnimationFrame(e)},[]),(0,f.jsx)(o.z,{present:s||x,children:t=>{let{present:a}=t;return(0,f.jsx)(l.WV.div,{"data-state":x?"active":"inactive","data-orientation":d.orientation,role:"tabpanel","aria-labelledby":u,hidden:!a,id:m,tabIndex:0,...c,ref:r,style:{...e.style,animationDuration:h.current?"0s":void 0},children:a&&i})}})});function k(e,r){return"".concat(e,"-trigger-").concat(r)}function R(e,r){return"".concat(e,"-content-").concat(r)}C.displayName=_;var Z=v,V=N,P=w,S=C}}]);