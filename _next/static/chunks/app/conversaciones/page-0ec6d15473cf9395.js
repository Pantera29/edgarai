(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[6975],{67944:function(e,t,r){Promise.resolve().then(r.bind(r,14986))},14986:function(e,t,r){"use strict";r.r(t),r.d(t,{default:function(){return p}});var n=r(57437),a=r(2265),s=r(66070),i=r(73578),o=r(35974),l=r(62869),d=r(95186),c=r(26815),u=r(53647),f=r(26110);let m=[{id:1,cliente:"Juan P\xe9rez",telefono:"+34 123 456 789",fecha:"2023-07-01",tipo:"Consulta",estado:"Cerrado",intencion:"Agendar servicio"},{id:2,cliente:"Mar\xeda Garc\xeda",telefono:"+34 987 654 321",fecha:"2023-07-02",tipo:"Queja",estado:"En proceso",intencion:"Problema t\xe9cnico"},{id:3,cliente:"Carlos Rodr\xedguez",telefono:"+34 456 789 123",fecha:"2023-07-03",tipo:"Solicitud",estado:"Abierto",intencion:"Consulta status actual"}],x=["Agendar servicio","Consulta status actual","Problema t\xe9cnico","Informaci\xf3n general"];function p(){let[e,t]=(0,a.useState)(m),[r,p]=(0,a.useState)(!1),[h,g]=(0,a.useState)({cliente:"",telefono:"",tipo:"",estado:"Abierto",intencion:""}),b=e=>{g({...h,[e.target.name]:e.target.value})},j=(e,t)=>{g({...h,[e]:t})},N=e=>{let t=e.replace(/\s+/g,"");window.open("https://wa.me/".concat(t),"_blank")};return(0,n.jsxs)("div",{className:"container mx-auto py-10",children:[(0,n.jsxs)("div",{className:"flex justify-between items-center mb-6",children:[(0,n.jsx)("h1",{className:"text-3xl font-bold",children:"Conversaciones con Clientes"}),(0,n.jsxs)(f.Vq,{open:r,onOpenChange:p,children:[(0,n.jsx)(f.hg,{asChild:!0,children:(0,n.jsx)(l.z,{children:"Nueva Conversaci\xf3n"})}),(0,n.jsxs)(f.cZ,{children:[(0,n.jsxs)(f.fK,{children:[(0,n.jsx)(f.$N,{children:"A\xf1adir Nueva Conversaci\xf3n"}),(0,n.jsx)(f.Be,{children:"Ingrese los detalles de la nueva conversaci\xf3n con el cliente."})]}),(0,n.jsxs)("form",{onSubmit:r=>{r.preventDefault();let n={...h,id:e.length+1,fecha:new Date().toISOString().split("T")[0]};t([...e,n]),p(!1),g({cliente:"",telefono:"",tipo:"",estado:"Abierto",intencion:""})},children:[(0,n.jsxs)("div",{className:"grid gap-4 py-4",children:[(0,n.jsxs)("div",{className:"grid grid-cols-4 items-center gap-4",children:[(0,n.jsx)(c._,{htmlFor:"cliente",className:"text-right",children:"Cliente"}),(0,n.jsx)(d.I,{id:"cliente",name:"cliente",value:h.cliente,onChange:b,className:"col-span-3"})]}),(0,n.jsxs)("div",{className:"grid grid-cols-4 items-center gap-4",children:[(0,n.jsx)(c._,{htmlFor:"telefono",className:"text-right",children:"Tel\xe9fono"}),(0,n.jsx)(d.I,{id:"telefono",name:"telefono",value:h.telefono,onChange:b,className:"col-span-3",placeholder:"+34 123 456 789"})]}),(0,n.jsxs)("div",{className:"grid grid-cols-4 items-center gap-4",children:[(0,n.jsx)(c._,{htmlFor:"tipo",className:"text-right",children:"Tipo"}),(0,n.jsxs)(u.Ph,{onValueChange:e=>j("tipo",e),defaultValue:h.tipo,children:[(0,n.jsx)(u.i4,{className:"col-span-3",children:(0,n.jsx)(u.ki,{placeholder:"Seleccione el tipo"})}),(0,n.jsxs)(u.Bw,{children:[(0,n.jsx)(u.Ql,{value:"Consulta",children:"Consulta"}),(0,n.jsx)(u.Ql,{value:"Queja",children:"Queja"}),(0,n.jsx)(u.Ql,{value:"Solicitud",children:"Solicitud"})]})]})]}),(0,n.jsxs)("div",{className:"grid grid-cols-4 items-center gap-4",children:[(0,n.jsx)(c._,{htmlFor:"intencion",className:"text-right",children:"Intenci\xf3n"}),(0,n.jsxs)(u.Ph,{onValueChange:e=>j("intencion",e),defaultValue:h.intencion,children:[(0,n.jsx)(u.i4,{className:"col-span-3",children:(0,n.jsx)(u.ki,{placeholder:"Seleccione la intenci\xf3n"})}),(0,n.jsx)(u.Bw,{children:x.map(e=>(0,n.jsx)(u.Ql,{value:e,children:e},e))})]})]})]}),(0,n.jsx)(f.cN,{children:(0,n.jsx)(l.z,{type:"submit",children:"Guardar Conversaci\xf3n"})})]})]})]})]}),(0,n.jsxs)(s.Zb,{children:[(0,n.jsxs)(s.Ol,{children:[(0,n.jsx)(s.ll,{children:"Registro de Conversaciones"}),(0,n.jsx)(s.SZ,{children:"Historial de contactos con clientes"})]}),(0,n.jsx)(s.aY,{children:(0,n.jsxs)(i.iA,{children:[(0,n.jsx)(i.xD,{children:(0,n.jsxs)(i.SC,{children:[(0,n.jsx)(i.ss,{children:"Cliente"}),(0,n.jsx)(i.ss,{children:"Tel\xe9fono"}),(0,n.jsx)(i.ss,{children:"Fecha"}),(0,n.jsx)(i.ss,{children:"Tipo"}),(0,n.jsx)(i.ss,{children:"Intenci\xf3n"}),(0,n.jsx)(i.ss,{children:"Estado"}),(0,n.jsx)(i.ss,{children:"Acci\xf3n"})]})}),(0,n.jsx)(i.RM,{children:e.map(e=>(0,n.jsxs)(i.SC,{children:[(0,n.jsx)(i.pj,{children:e.cliente}),(0,n.jsx)(i.pj,{children:e.telefono}),(0,n.jsx)(i.pj,{children:e.fecha}),(0,n.jsx)(i.pj,{children:e.tipo}),(0,n.jsx)(i.pj,{children:(0,n.jsx)(o.C,{variant:"outline",children:e.intencion})}),(0,n.jsx)(i.pj,{children:(0,n.jsx)(o.C,{variant:"Cerrado"===e.estado?"secondary":"En proceso"===e.estado?"default":"destructive",children:e.estado})}),(0,n.jsx)(i.pj,{children:(0,n.jsx)(l.z,{variant:"outline",size:"sm",onClick:()=>N(e.telefono),children:"WhatsApp"})})]},e.id))})]})})]})]})}},35974:function(e,t,r){"use strict";r.d(t,{C:function(){return o}});var n=r(57437);r(2265);var a=r(90535),s=r(94508);let i=(0,a.j)("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",{variants:{variant:{default:"border-transparent bg-primary text-primary-foreground",secondary:"border-transparent bg-secondary text-secondary-foreground",destructive:"border-transparent bg-destructive text-destructive-foreground",outline:"text-foreground",success:"border-transparent bg-green-100 text-green-800",warning:"border-transparent bg-yellow-100 text-yellow-800",info:"border-transparent bg-blue-100 text-blue-800"}},defaultVariants:{variant:"default"}});function o(e){let{className:t,variant:r,...a}=e;return(0,n.jsx)("div",{className:(0,s.cn)(i({variant:r}),t),...a})}},62869:function(e,t,r){"use strict";r.d(t,{d:function(){return l},z:function(){return d}});var n=r(57437),a=r(2265),s=r(37053),i=r(90535),o=r(94508);let l=(0,i.j)("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",{variants:{variant:{default:"bg-primary text-primary-foreground shadow hover:bg-primary/90",destructive:"bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",outline:"border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",secondary:"bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",ghost:"hover:bg-accent hover:text-accent-foreground",link:"text-primary underline-offset-4 hover:underline"},size:{default:"h-9 px-4 py-2",sm:"h-8 rounded-md px-3 text-xs",lg:"h-10 rounded-md px-8",icon:"h-9 w-9"}},defaultVariants:{variant:"default",size:"default"}}),d=a.forwardRef((e,t)=>{let{className:r,variant:a,size:i,asChild:d=!1,...c}=e,u=d?s.g7:"button";return(0,n.jsx)(u,{className:(0,o.cn)(l({variant:a,size:i,className:r})),ref:t,...c})});d.displayName="Button"},66070:function(e,t,r){"use strict";r.d(t,{Ol:function(){return o},SZ:function(){return d},Zb:function(){return i},aY:function(){return c},ll:function(){return l}});var n=r(57437),a=r(2265),s=r(94508);let i=a.forwardRef((e,t)=>{let{className:r,...a}=e;return(0,n.jsx)("div",{ref:t,className:(0,s.cn)("rounded-xl border bg-card text-card-foreground shadow",r),...a})});i.displayName="Card";let o=a.forwardRef((e,t)=>{let{className:r,...a}=e;return(0,n.jsx)("div",{ref:t,className:(0,s.cn)("flex flex-col space-y-1.5 p-6",r),...a})});o.displayName="CardHeader";let l=a.forwardRef((e,t)=>{let{className:r,...a}=e;return(0,n.jsx)("h3",{ref:t,className:(0,s.cn)("font-semibold leading-none tracking-tight",r),...a})});l.displayName="CardTitle";let d=a.forwardRef((e,t)=>{let{className:r,...a}=e;return(0,n.jsx)("p",{ref:t,className:(0,s.cn)("text-sm text-muted-foreground",r),...a})});d.displayName="CardDescription";let c=a.forwardRef((e,t)=>{let{className:r,...a}=e;return(0,n.jsx)("div",{ref:t,className:(0,s.cn)("p-6 pt-0",r),...a})});c.displayName="CardContent"},26110:function(e,t,r){"use strict";r.d(t,{$N:function(){return p},Be:function(){return h},Vq:function(){return l},cN:function(){return x},cZ:function(){return f},fK:function(){return m},hg:function(){return d}});var n=r(57437),a=r(2265),s=r(49027),i=r(32489),o=r(94508);let l=s.fC,d=s.xz,c=s.h_;s.x8;let u=a.forwardRef((e,t)=>{let{className:r,...a}=e;return(0,n.jsx)(s.aV,{ref:t,className:(0,o.cn)("fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",r),...a})});u.displayName=s.aV.displayName;let f=a.forwardRef((e,t)=>{let{className:r,children:a,...l}=e;return(0,n.jsxs)(c,{children:[(0,n.jsx)(u,{}),(0,n.jsxs)(s.VY,{ref:t,className:(0,o.cn)("fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",r),...l,children:[a,(0,n.jsxs)(s.x8,{className:"absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground",children:[(0,n.jsx)(i.Z,{className:"h-4 w-4"}),(0,n.jsx)("span",{className:"sr-only",children:"Close"})]})]})]})});f.displayName=s.VY.displayName;let m=e=>{let{className:t,...r}=e;return(0,n.jsx)("div",{className:(0,o.cn)("flex flex-col space-y-1.5 text-center sm:text-left",t),...r})};m.displayName="DialogHeader";let x=e=>{let{className:t,...r}=e;return(0,n.jsx)("div",{className:(0,o.cn)("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",t),...r})};x.displayName="DialogFooter";let p=a.forwardRef((e,t)=>{let{className:r,...a}=e;return(0,n.jsx)(s.Dx,{ref:t,className:(0,o.cn)("text-lg font-semibold leading-none tracking-tight",r),...a})});p.displayName=s.Dx.displayName;let h=a.forwardRef((e,t)=>{let{className:r,...a}=e;return(0,n.jsx)(s.dk,{ref:t,className:(0,o.cn)("text-sm text-muted-foreground",r),...a})});h.displayName=s.dk.displayName},95186:function(e,t,r){"use strict";r.d(t,{I:function(){return i}});var n=r(57437),a=r(2265),s=r(94508);let i=a.forwardRef((e,t)=>{let{className:r,type:a,...i}=e;return(0,n.jsx)("input",{type:a,className:(0,s.cn)("flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300",r),ref:t,...i})});i.displayName="Input"},26815:function(e,t,r){"use strict";r.d(t,{_:function(){return o}});var n=r(57437),a=r(2265),s=r(6394),i=r(94508);let o=a.forwardRef((e,t)=>{let{className:r,...a}=e;return(0,n.jsx)(s.f,{ref:t,className:(0,i.cn)("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",r),...a})});o.displayName=s.f.displayName},53647:function(e,t,r){"use strict";r.d(t,{Bw:function(){return f},Ph:function(){return d},Ql:function(){return m},i4:function(){return u},ki:function(){return c}});var n=r(57437),a=r(2265),s=r(93402),i=r(40875),o=r(30401),l=r(94508);let d=s.fC;s.ZA;let c=s.B4,u=a.forwardRef((e,t)=>{let{className:r,children:a,...o}=e;return(0,n.jsxs)(s.xz,{ref:t,className:(0,l.cn)("flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",r),...o,children:[a,(0,n.jsx)(s.JO,{asChild:!0,children:(0,n.jsx)(i.Z,{className:"h-4 w-4 opacity-50"})})]})});u.displayName=s.xz.displayName;let f=a.forwardRef((e,t)=>{let{className:r,children:a,position:i="popper",...o}=e;return(0,n.jsx)(s.h_,{children:(0,n.jsx)(s.VY,{ref:t,className:(0,l.cn)("relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2","popper"===i&&"data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",r),position:i,...o,children:(0,n.jsx)(s.l_,{className:(0,l.cn)("p-1","popper"===i&&"h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"),children:a})})})});f.displayName=s.VY.displayName,a.forwardRef((e,t)=>{let{className:r,...a}=e;return(0,n.jsx)(s.__,{ref:t,className:(0,l.cn)("py-1.5 pl-8 pr-2 text-sm font-semibold",r),...a})}).displayName=s.__.displayName;let m=a.forwardRef((e,t)=>{let{className:r,children:a,...i}=e;return(0,n.jsxs)(s.ck,{ref:t,className:(0,l.cn)("relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",r),...i,children:[(0,n.jsx)("span",{className:"absolute left-2 flex h-3.5 w-3.5 items-center justify-center",children:(0,n.jsx)(s.wU,{children:(0,n.jsx)(o.Z,{className:"h-4 w-4"})})}),(0,n.jsx)(s.eT,{children:a})]})});m.displayName=s.ck.displayName,a.forwardRef((e,t)=>{let{className:r,...a}=e;return(0,n.jsx)(s.Z0,{ref:t,className:(0,l.cn)("-mx-1 my-1 h-px bg-muted",r),...a})}).displayName=s.Z0.displayName},73578:function(e,t,r){"use strict";r.d(t,{RM:function(){return l},SC:function(){return d},iA:function(){return i},pj:function(){return u},ss:function(){return c},xD:function(){return o}});var n=r(57437),a=r(2265),s=r(94508);let i=a.forwardRef((e,t)=>{let{className:r,...a}=e;return(0,n.jsx)("div",{className:"relative w-full overflow-auto",children:(0,n.jsx)("table",{ref:t,className:(0,s.cn)("w-full caption-bottom text-sm",r),...a})})});i.displayName="Table";let o=a.forwardRef((e,t)=>{let{className:r,...a}=e;return(0,n.jsx)("thead",{ref:t,className:(0,s.cn)("[&_tr]:border-b",r),...a})});o.displayName="TableHeader";let l=a.forwardRef((e,t)=>{let{className:r,...a}=e;return(0,n.jsx)("tbody",{ref:t,className:(0,s.cn)("[&_tr:last-child]:border-0",r),...a})});l.displayName="TableBody",a.forwardRef((e,t)=>{let{className:r,...a}=e;return(0,n.jsx)("tfoot",{ref:t,className:(0,s.cn)("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",r),...a})}).displayName="TableFooter";let d=a.forwardRef((e,t)=>{let{className:r,...a}=e;return(0,n.jsx)("tr",{ref:t,className:(0,s.cn)("border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",r),...a})});d.displayName="TableRow";let c=a.forwardRef((e,t)=>{let{className:r,...a}=e;return(0,n.jsx)("th",{ref:t,className:(0,s.cn)("h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",r),...a})});c.displayName="TableHead";let u=a.forwardRef((e,t)=>{let{className:r,...a}=e;return(0,n.jsx)("td",{ref:t,className:(0,s.cn)("p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",r),...a})});u.displayName="TableCell",a.forwardRef((e,t)=>{let{className:r,...a}=e;return(0,n.jsx)("caption",{ref:t,className:(0,s.cn)("mt-4 text-sm text-muted-foreground",r),...a})}).displayName="TableCaption"},94508:function(e,t,r){"use strict";r.d(t,{S:function(){return i},cn:function(){return s}});var n=r(61994),a=r(53335);function s(){for(var e=arguments.length,t=Array(e),r=0;r<e;r++)t[r]=arguments[r];return(0,a.m6)((0,n.W)(t))}function i(){return"/edgarai"}}},function(e){e.O(0,[9903,4384,6008,6668,2360,188,2971,2117,1744],function(){return e(e.s=67944)}),_N_E=e.O()}]);