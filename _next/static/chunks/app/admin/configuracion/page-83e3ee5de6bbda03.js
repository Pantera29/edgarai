(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[1956],{57945:function(e,r,a){Promise.resolve().then(a.bind(a,90974))},90974:function(e,r,a){"use strict";a.r(r),a.d(r,{default:function(){return x}});var n=a(57437),t=a(2265),s=a(66070),i=a(95452),l=a(95186),o=a(26815),c=a(62869),d=a(1828),u=a(91723),f=a(14438),m=a(94508);let h=["Domingo","Lunes","Martes","Mi\xe9rcoles","Jueves","Viernes","S\xe1bado"];function x(){let[e,r]=(0,t.useState)(null),[a,x]=(0,t.useState)([]),[g,p]=(0,t.useState)(!0),[b,v]=(0,t.useState)(!1),_=(0,i.createClientComponentClient)();(0,t.useEffect)(()=>{j()},[]);let j=async()=>{p(!0);try{let{data:e}=await _.from("configuracion_taller").select("*").limit(1).single();e&&r(e);let{data:a}=await _.from("horarios_operacion").select("*").order("dia_semana");if(a&&a.length>0)x(a);else{let r=h.map((r,a)=>({id_horario:crypto.randomUUID(),id_taller:(null==e?void 0:e.id_taller)||crypto.randomUUID(),dia_semana:a+1,es_dia_laboral:0!==a,hora_apertura:"09:00:00",hora_cierre:"18:00:00",servicios_simultaneos_max:3}));x(r)}}catch(e){console.error("Error al cargar datos:",e),f.Am.error("Error al cargar la configuraci\xf3n")}finally{p(!1)}},y=async()=>{try{let{error:r}=await _.from("configuracion_taller").upsert({...e,actualizado_el:new Date().toISOString()});if(r)throw r;let{error:n}=await _.from("horarios_operacion").upsert(a);if(n)throw n;v(!1),f.Am.success("Configuraci\xf3n guardada correctamente"),await j()}catch(e){console.error("Error al guardar:",e),f.Am.error("Error al guardar la configuraci\xf3n")}},w=(e,r)=>{x(a=>a.map(a=>a.dia_semana===e+1?{...a,...r}:a))};return g?(0,n.jsx)("div",{className:"text-center py-4",children:"Cargando configuraci\xf3n..."}):(0,n.jsxs)("div",{className:"container mx-auto p-6 space-y-6",children:[(0,n.jsxs)("div",{className:"flex justify-between items-center",children:[(0,n.jsx)("h1",{className:"text-3xl font-bold",children:"Configuraci\xf3n del Taller"}),!b&&(0,n.jsx)(c.z,{onClick:()=>v(!0),children:"Modificar Configuraci\xf3n"})]}),(0,n.jsxs)("div",{className:"grid gap-6",children:[(0,n.jsxs)(s.Zb,{children:[(0,n.jsx)(s.Ol,{children:(0,n.jsx)(s.ll,{children:"Par\xe1metros Generales"})}),(0,n.jsx)(s.aY,{children:(0,n.jsxs)("div",{className:"space-y-2",children:[(0,n.jsx)(o._,{children:"Duraci\xf3n del Turno (minutos)"}),(0,n.jsx)(l.I,{type:"number",min:"15",max:"60",step:"5",value:(null==e?void 0:e.duracion_turno)||30,onChange:e=>r(r=>({...r,duracion_turno:parseInt(e.target.value)})),disabled:!b,className:"max-w-[200px]"})]})})]}),(0,n.jsxs)(s.Zb,{children:[(0,n.jsx)(s.Ol,{children:(0,n.jsx)(s.ll,{children:"Horarios de Operaci\xf3n"})}),(0,n.jsx)(s.aY,{className:"space-y-4",children:h.map((e,r)=>{let t=a.find(e=>e.dia_semana===r+1);return t?(0,n.jsx)("div",{className:(0,m.cn)("p-4 border rounded-lg",t.es_dia_laboral?"bg-card":"bg-muted"),children:(0,n.jsxs)("div",{className:"flex items-center justify-between",children:[(0,n.jsxs)("div",{className:"flex items-center gap-4",children:[(0,n.jsx)(d.r,{checked:t.es_dia_laboral,onCheckedChange:e=>w(r,{es_dia_laboral:e}),disabled:!b}),(0,n.jsx)(o._,{children:e})]}),t.es_dia_laboral&&(0,n.jsxs)("div",{className:"flex items-center gap-4",children:[(0,n.jsxs)("div",{className:"flex items-center gap-2",children:[(0,n.jsx)(u.Z,{className:"h-4 w-4"}),(0,n.jsx)(l.I,{type:"time",value:t.hora_apertura.slice(0,5),onChange:e=>w(r,{hora_apertura:e.target.value+":00"}),disabled:!b,className:"w-32"}),(0,n.jsx)("span",{children:"-"}),(0,n.jsx)(l.I,{type:"time",value:t.hora_cierre.slice(0,5),onChange:e=>w(r,{hora_cierre:e.target.value+":00"}),disabled:!b,className:"w-32"})]}),(0,n.jsx)(l.I,{type:"number",min:"1",max:"10",value:t.servicios_simultaneos_max,onChange:e=>w(r,{servicios_simultaneos_max:parseInt(e.target.value)}),disabled:!b,className:"w-24"})]})]})},r):null})})]}),b&&(0,n.jsxs)("div",{className:"flex justify-end gap-4",children:[(0,n.jsx)(c.z,{variant:"outline",onClick:()=>v(!1),children:"Cancelar"}),(0,n.jsx)(c.z,{onClick:y,children:"Guardar Cambios"})]})]})]})}},62869:function(e,r,a){"use strict";a.d(r,{d:function(){return o},z:function(){return c}});var n=a(57437),t=a(2265),s=a(37053),i=a(90535),l=a(94508);let o=(0,i.j)("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",{variants:{variant:{default:"bg-primary text-primary-foreground shadow hover:bg-primary/90",destructive:"bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",outline:"border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",secondary:"bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",ghost:"hover:bg-accent hover:text-accent-foreground",link:"text-primary underline-offset-4 hover:underline"},size:{default:"h-9 px-4 py-2",sm:"h-8 rounded-md px-3 text-xs",lg:"h-10 rounded-md px-8",icon:"h-9 w-9"}},defaultVariants:{variant:"default",size:"default"}}),c=t.forwardRef((e,r)=>{let{className:a,variant:t,size:i,asChild:c=!1,...d}=e,u=c?s.g7:"button";return(0,n.jsx)(u,{className:(0,l.cn)(o({variant:t,size:i,className:a})),ref:r,...d})});c.displayName="Button"},66070:function(e,r,a){"use strict";a.d(r,{Ol:function(){return l},SZ:function(){return c},Zb:function(){return i},aY:function(){return d},ll:function(){return o}});var n=a(57437),t=a(2265),s=a(94508);let i=t.forwardRef((e,r)=>{let{className:a,...t}=e;return(0,n.jsx)("div",{ref:r,className:(0,s.cn)("rounded-xl border bg-card text-card-foreground shadow",a),...t})});i.displayName="Card";let l=t.forwardRef((e,r)=>{let{className:a,...t}=e;return(0,n.jsx)("div",{ref:r,className:(0,s.cn)("flex flex-col space-y-1.5 p-6",a),...t})});l.displayName="CardHeader";let o=t.forwardRef((e,r)=>{let{className:a,...t}=e;return(0,n.jsx)("h3",{ref:r,className:(0,s.cn)("font-semibold leading-none tracking-tight",a),...t})});o.displayName="CardTitle";let c=t.forwardRef((e,r)=>{let{className:a,...t}=e;return(0,n.jsx)("p",{ref:r,className:(0,s.cn)("text-sm text-muted-foreground",a),...t})});c.displayName="CardDescription";let d=t.forwardRef((e,r)=>{let{className:a,...t}=e;return(0,n.jsx)("div",{ref:r,className:(0,s.cn)("p-6 pt-0",a),...t})});d.displayName="CardContent"},95186:function(e,r,a){"use strict";a.d(r,{I:function(){return i}});var n=a(57437),t=a(2265),s=a(94508);let i=t.forwardRef((e,r)=>{let{className:a,type:t,...i}=e;return(0,n.jsx)("input",{type:t,className:(0,s.cn)("flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300",a),ref:r,...i})});i.displayName="Input"},26815:function(e,r,a){"use strict";a.d(r,{_:function(){return l}});var n=a(57437),t=a(2265),s=a(6394),i=a(94508);let l=t.forwardRef((e,r)=>{let{className:a,...t}=e;return(0,n.jsx)(s.f,{ref:r,className:(0,i.cn)("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",a),...t})});l.displayName=s.f.displayName},1828:function(e,r,a){"use strict";a.d(r,{r:function(){return s}});var n=a(57437);a(2265);var t=a(50721);function s(e){let{checked:r,onCheckedChange:a,disabled:s}=e;return(0,n.jsx)(t.fC,{checked:r,onCheckedChange:a,disabled:s,className:"peer inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",children:(0,n.jsx)(t.bU,{className:"pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"})})}},94508:function(e,r,a){"use strict";a.d(r,{S:function(){return i},cn:function(){return s}});var n=a(61994),t=a(53335);function s(){for(var e=arguments.length,r=Array(e),a=0;a<e;a++)r[a]=arguments[a];return(0,t.m6)((0,n.W)(r))}function i(){return"/edgarai"}}},function(e){e.O(0,[6137,3777,5452,3556,9914,2971,2117,1744],function(){return e(e.s=57945)}),_N_E=e.O()}]);