(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[2630],{47057:function(e,t,a){Promise.resolve().then(a.bind(a,913))},913:function(e,t,a){"use strict";a.r(t),a.d(t,{default:function(){return j}});var s=a(57437),n=a(2265),r=a(73578),i=a(62869),l=a(84190),o=a(56266),d=a(39763);let c=(0,d.Z)("History",[["path",{d:"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",key:"1357e3"}],["path",{d:"M3 3v5h5",key:"1xhq8a"}],["path",{d:"M12 7v5l4 2",key:"1fdv2h"}]]),u=(0,d.Z)("PenSquare",[["path",{d:"M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7",key:"1qinfi"}],["path",{d:"M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z",key:"w2jsv5"}]]),f=(0,d.Z)("Trash2",[["path",{d:"M3 6h18",key:"d0wm0j"}],["path",{d:"M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6",key:"4alrt4"}],["path",{d:"M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2",key:"v07s0e"}],["line",{x1:"10",x2:"10",y1:"11",y2:"17",key:"1uufr5"}],["line",{x1:"14",x2:"14",y1:"11",y2:"17",key:"xtxkd"}]]);var m=a(27648),p=a(94508);function x(e){let{className:t,...a}=e;return(0,s.jsx)("div",{className:(0,p.cn)("animate-pulse rounded-md bg-muted",t),...a})}var h=a(2141),y=a(26110),b=a(77992);function g(e){let{clientes:t,loading:a=!1,onClienteDeleted:d}=e,{toast:p}=(0,b.pm)(),[g,v]=(0,n.useState)(null),[j,N]=(0,n.useState)(!1),w=async()=>{if(g){N(!0);try{let{error:e}=await h.O.from("clientes").delete().eq("id uuid",g.id_uuid);if(e)throw e;p({title:"Cliente eliminado",description:"El cliente ha sido eliminado correctamente"}),null==d||d()}catch(e){console.error("Error eliminando cliente:",e),p({variant:"destructive",title:"Error",description:"No se pudo eliminar el cliente"})}finally{N(!1),v(null)}}};return a?(0,s.jsx)(x,{className:"h-[400px]"}):(0,s.jsxs)(s.Fragment,{children:[(0,s.jsxs)(r.iA,{children:[(0,s.jsx)(r.xD,{children:(0,s.jsxs)(r.SC,{children:[(0,s.jsx)(r.ss,{children:"Nombre"}),(0,s.jsx)(r.ss,{children:"Email"}),(0,s.jsx)(r.ss,{children:"Tel\xe9fono"}),(0,s.jsx)(r.ss,{className:"text-right",children:"Acciones"})]})}),(0,s.jsx)(r.RM,{children:t.map(e=>(0,s.jsxs)(r.SC,{children:[(0,s.jsx)(r.pj,{children:e.nombre}),(0,s.jsx)(r.pj,{children:e.email}),(0,s.jsx)(r.pj,{children:e.telefono}),(0,s.jsx)(r.pj,{className:"text-right",children:(0,s.jsxs)(l.h_,{children:[(0,s.jsx)(l.$F,{asChild:!0,children:(0,s.jsxs)(i.z,{variant:"ghost",className:"h-8 w-8 p-0",children:[(0,s.jsx)("span",{className:"sr-only",children:"Abrir men\xfa"}),(0,s.jsx)(o.Z,{className:"h-4 w-4"})]})}),(0,s.jsxs)(l.AW,{align:"end",children:[(0,s.jsx)(l.Xi,{asChild:!0,children:(0,s.jsxs)(m.default,{href:"/clientes/".concat(e.id_uuid,"/historial"),className:"flex items-center",children:[(0,s.jsx)(c,{className:"mr-2 h-4 w-4"}),"Ver Historial"]})}),(0,s.jsx)(l.Xi,{asChild:!0,children:(0,s.jsxs)(m.default,{href:"/clientes/".concat(e.id_uuid,"/editar"),className:"flex items-center",children:[(0,s.jsx)(u,{className:"mr-2 h-4 w-4"}),"Editar"]})}),(0,s.jsxs)(l.Xi,{className:"flex items-center text-destructive",onClick:()=>v(e),children:[(0,s.jsx)(f,{className:"mr-2 h-4 w-4"}),"Eliminar"]})]})]})})]},e.id_uuid))})]}),(0,s.jsx)(y.Vq,{open:!!g,onOpenChange:()=>v(null),children:(0,s.jsxs)(y.cZ,{children:[(0,s.jsxs)(y.fK,{children:[(0,s.jsx)(y.$N,{children:"\xbfEliminar cliente?"}),(0,s.jsxs)(y.Be,{children:["Esta acci\xf3n no se puede deshacer. Se eliminar\xe1 permanentemente el cliente",null==g?void 0:g.nombre," y todos sus datos asociados."]})]}),(0,s.jsxs)(y.cN,{children:[(0,s.jsx)(i.z,{variant:"outline",onClick:()=>v(null),disabled:j,children:"Cancelar"}),(0,s.jsx)(i.z,{variant:"destructive",onClick:w,disabled:j,children:j?"Eliminando...":"Eliminar"})]})]})})]})}var v=a(95186);function j(){let[e,t]=(0,n.useState)([]),[a,r]=(0,n.useState)(""),[l,o]=(0,n.useState)("todos"),[d,c]=(0,n.useState)(1),[u,f]=(0,n.useState)(0),[p,x]=(0,n.useState)(!1),[y,b]=(0,n.useState)(null),[j,N]=(0,n.useState)(!1),[w,k]=(0,n.useState)({nombre:"",email:"",telefono:""});(0,n.useEffect)(()=>{C()},[a,l,d]),(0,n.useEffect)(()=>{let e=new URLSearchParams(window.location.search).get("id");e&&b(e)},[]);let C=async()=>{x(!0);try{let e=h.O.from("clientes").select("*",{count:"exact"}).order("nombre").range((d-1)*10,10*d-1);a&&(e=e.or("nombre.ilike.%".concat(a,"%,email.ilike.%").concat(a,"%,telefono.ilike.%").concat(a,"%"))),"todos"!==l&&(e=e.eq("estado",l));let{data:s,count:n,error:r}=await e;if(r)throw r;let i=(s||[]).map(e=>({id_uuid:e.id_uuid,nombre:e.nombre,email:e.email,telefono:e.telefono,estado:e.estado}));t(i),f(n||0)}catch(e){console.error("Error cargando clientes:",e)}finally{x(!1)}},S=e.filter(e=>{var t,s;return y?e.id_uuid===y:e.nombre.toLowerCase().includes(a.toLowerCase())||(null===(t=e.email)||void 0===t?void 0:t.toLowerCase().includes(a.toLowerCase()))||(null===(s=e.telefono)||void 0===s?void 0:s.includes(a))});return(0,s.jsxs)("div",{className:"flex-1 space-y-4 p-8 pt-6",children:[(0,s.jsxs)("div",{className:"flex items-center justify-between space-y-2",children:[(0,s.jsx)("h2",{className:"text-3xl font-bold tracking-tight",children:"Clientes"}),(0,s.jsx)("div",{className:"flex items-center space-x-2",children:(0,s.jsx)(i.z,{asChild:!0,children:(0,s.jsx)(m.default,{href:"/clientes/nuevo",children:"Registrar Cliente"})})})]}),(0,s.jsx)("div",{className:"flex items-center justify-between",children:(0,s.jsx)("div",{className:"flex flex-1 items-center space-x-2",children:(0,s.jsx)(v.I,{placeholder:"Buscar clientes...",className:"w-[150px] lg:w-[250px]",value:a,onChange:e=>r(e.target.value)})})}),(0,s.jsx)(g,{clientes:S,loading:p}),(0,s.jsxs)("div",{className:"flex justify-between items-center",children:[(0,s.jsxs)("div",{className:"text-sm text-muted-foreground",children:["Mostrando ",(d-1)*10+1," - ",Math.min(10*d,u)," de ",u," clientes"]}),(0,s.jsxs)("div",{className:"flex gap-2",children:[(0,s.jsx)(i.z,{variant:"outline",disabled:1===d,onClick:()=>c(e=>e-1),children:"Anterior"}),(0,s.jsx)(i.z,{variant:"outline",disabled:10*d>=u,onClick:()=>c(e=>e+1),children:"Siguiente"})]})]}),y&&(0,s.jsx)(i.z,{variant:"outline",onClick:()=>{b(null),window.history.pushState({},"","/clientes")},children:"Ver todos los clientes"})]})}},62869:function(e,t,a){"use strict";a.d(t,{d:function(){return o},z:function(){return d}});var s=a(57437),n=a(2265),r=a(37053),i=a(90535),l=a(94508);let o=(0,i.j)("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",{variants:{variant:{default:"bg-primary text-primary-foreground shadow hover:bg-primary/90",destructive:"bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",outline:"border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",secondary:"bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",ghost:"hover:bg-accent hover:text-accent-foreground",link:"text-primary underline-offset-4 hover:underline"},size:{default:"h-9 px-4 py-2",sm:"h-8 rounded-md px-3 text-xs",lg:"h-10 rounded-md px-8",icon:"h-9 w-9"}},defaultVariants:{variant:"default",size:"default"}}),d=n.forwardRef((e,t)=>{let{className:a,variant:n,size:i,asChild:d=!1,...c}=e,u=d?r.g7:"button";return(0,s.jsx)(u,{className:(0,l.cn)(o({variant:n,size:i,className:a})),ref:t,...c})});d.displayName="Button"},26110:function(e,t,a){"use strict";a.d(t,{$N:function(){return x},Be:function(){return h},Vq:function(){return o},cN:function(){return p},cZ:function(){return f},fK:function(){return m},hg:function(){return d}});var s=a(57437),n=a(2265),r=a(49027),i=a(32489),l=a(94508);let o=r.fC,d=r.xz,c=r.h_;r.x8;let u=n.forwardRef((e,t)=>{let{className:a,...n}=e;return(0,s.jsx)(r.aV,{ref:t,className:(0,l.cn)("fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",a),...n})});u.displayName=r.aV.displayName;let f=n.forwardRef((e,t)=>{let{className:a,children:n,...o}=e;return(0,s.jsxs)(c,{children:[(0,s.jsx)(u,{}),(0,s.jsxs)(r.VY,{ref:t,className:(0,l.cn)("fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",a),...o,children:[n,(0,s.jsxs)(r.x8,{className:"absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground",children:[(0,s.jsx)(i.Z,{className:"h-4 w-4"}),(0,s.jsx)("span",{className:"sr-only",children:"Close"})]})]})]})});f.displayName=r.VY.displayName;let m=e=>{let{className:t,...a}=e;return(0,s.jsx)("div",{className:(0,l.cn)("flex flex-col space-y-1.5 text-center sm:text-left",t),...a})};m.displayName="DialogHeader";let p=e=>{let{className:t,...a}=e;return(0,s.jsx)("div",{className:(0,l.cn)("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",t),...a})};p.displayName="DialogFooter";let x=n.forwardRef((e,t)=>{let{className:a,...n}=e;return(0,s.jsx)(r.Dx,{ref:t,className:(0,l.cn)("text-lg font-semibold leading-none tracking-tight",a),...n})});x.displayName=r.Dx.displayName;let h=n.forwardRef((e,t)=>{let{className:a,...n}=e;return(0,s.jsx)(r.dk,{ref:t,className:(0,l.cn)("text-sm text-muted-foreground",a),...n})});h.displayName=r.dk.displayName},84190:function(e,t,a){"use strict";a.d(t,{$F:function(){return u},AW:function(){return f},Ju:function(){return p},VD:function(){return x},Xi:function(){return m},h_:function(){return c}});var s=a(57437),n=a(2265),r=a(70085),i=a(10407),l=a(30401),o=a(40519),d=a(94508);let c=r.fC,u=r.xz;r.ZA,r.Uv,r.Tr,r.Ee,n.forwardRef((e,t)=>{let{className:a,inset:n,children:l,...o}=e;return(0,s.jsxs)(r.fF,{ref:t,className:(0,d.cn)("flex cursor-default gap-2 select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",n&&"pl-8",a),...o,children:[l,(0,s.jsx)(i.Z,{className:"ml-auto"})]})}).displayName=r.fF.displayName,n.forwardRef((e,t)=>{let{className:a,...n}=e;return(0,s.jsx)(r.tu,{ref:t,className:(0,d.cn)("z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",a),...n})}).displayName=r.tu.displayName;let f=n.forwardRef((e,t)=>{let{className:a,sideOffset:n=4,...i}=e;return(0,s.jsx)(r.Uv,{children:(0,s.jsx)(r.VY,{ref:t,sideOffset:n,className:(0,d.cn)("z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md","data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",a),...i})})});f.displayName=r.VY.displayName;let m=n.forwardRef((e,t)=>{let{className:a,inset:n,...i}=e;return(0,s.jsx)(r.ck,{ref:t,className:(0,d.cn)("relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0",n&&"pl-8",a),...i})});m.displayName=r.ck.displayName,n.forwardRef((e,t)=>{let{className:a,children:n,checked:i,...o}=e;return(0,s.jsxs)(r.oC,{ref:t,className:(0,d.cn)("relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",a),checked:i,...o,children:[(0,s.jsx)("span",{className:"absolute left-2 flex h-3.5 w-3.5 items-center justify-center",children:(0,s.jsx)(r.wU,{children:(0,s.jsx)(l.Z,{className:"h-4 w-4"})})}),n]})}).displayName=r.oC.displayName,n.forwardRef((e,t)=>{let{className:a,children:n,...i}=e;return(0,s.jsxs)(r.Rk,{ref:t,className:(0,d.cn)("relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",a),...i,children:[(0,s.jsx)("span",{className:"absolute left-2 flex h-3.5 w-3.5 items-center justify-center",children:(0,s.jsx)(r.wU,{children:(0,s.jsx)(o.Z,{className:"h-2 w-2 fill-current"})})}),n]})}).displayName=r.Rk.displayName;let p=n.forwardRef((e,t)=>{let{className:a,inset:n,...i}=e;return(0,s.jsx)(r.__,{ref:t,className:(0,d.cn)("px-2 py-1.5 text-sm font-semibold",n&&"pl-8",a),...i})});p.displayName=r.__.displayName;let x=n.forwardRef((e,t)=>{let{className:a,...n}=e;return(0,s.jsx)(r.Z0,{ref:t,className:(0,d.cn)("-mx-1 my-1 h-px bg-muted",a),...n})});x.displayName=r.Z0.displayName},95186:function(e,t,a){"use strict";a.d(t,{I:function(){return i}});var s=a(57437),n=a(2265),r=a(94508);let i=n.forwardRef((e,t)=>{let{className:a,type:n,...i}=e;return(0,s.jsx)("input",{type:n,className:(0,r.cn)("flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300",a),ref:t,...i})});i.displayName="Input"},73578:function(e,t,a){"use strict";a.d(t,{RM:function(){return o},SC:function(){return d},iA:function(){return i},pj:function(){return u},ss:function(){return c},xD:function(){return l}});var s=a(57437),n=a(2265),r=a(94508);let i=n.forwardRef((e,t)=>{let{className:a,...n}=e;return(0,s.jsx)("table",{ref:t,className:(0,r.cn)("w-full caption-bottom text-sm",a),...n})});i.displayName="Table";let l=n.forwardRef((e,t)=>{let{className:a,...n}=e;return(0,s.jsx)("thead",{ref:t,className:(0,r.cn)("[&_tr]:border-b",a),...n})});l.displayName="TableHeader";let o=n.forwardRef((e,t)=>{let{className:a,...n}=e;return(0,s.jsx)("tbody",{ref:t,className:(0,r.cn)("[&_tr:last-child]:border-0",a),...n})});o.displayName="TableBody",n.forwardRef((e,t)=>{let{className:a,...n}=e;return(0,s.jsx)("tfoot",{ref:t,className:(0,r.cn)("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",a),...n})}).displayName="TableFooter";let d=n.forwardRef((e,t)=>{let{className:a,...n}=e;return(0,s.jsx)("tr",{ref:t,className:(0,r.cn)("border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",a),...n})});d.displayName="TableRow";let c=n.forwardRef((e,t)=>{let{className:a,...n}=e;return(0,s.jsx)("th",{ref:t,className:(0,r.cn)("h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",a),...n})});c.displayName="TableHead";let u=n.forwardRef((e,t)=>{let{className:a,...n}=e;return(0,s.jsx)("td",{ref:t,className:(0,r.cn)("p-4 align-middle [&:has([role=checkbox])]:pr-0",a),...n})});u.displayName="TableCell",n.forwardRef((e,t)=>{let{className:a,...n}=e;return(0,s.jsx)("caption",{ref:t,className:(0,r.cn)("mt-4 text-sm text-muted-foreground",a),...n})}).displayName="TableCaption"},77992:function(e,t,a){"use strict";a.d(t,{pm:function(){return f}});var s=a(2265);let n=0,r=new Map,i=e=>{if(r.has(e))return;let t=setTimeout(()=>{r.delete(e),c({type:"REMOVE_TOAST",toastId:e})},1e6);r.set(e,t)},l=(e,t)=>{switch(t.type){case"ADD_TOAST":return{...e,toasts:[t.toast,...e.toasts].slice(0,1)};case"UPDATE_TOAST":return{...e,toasts:e.toasts.map(e=>e.id===t.toast.id?{...e,...t.toast}:e)};case"DISMISS_TOAST":{let{toastId:a}=t;return a?i(a):e.toasts.forEach(e=>{i(e.id)}),{...e,toasts:e.toasts.map(e=>e.id===a||void 0===a?{...e,open:!1}:e)}}case"REMOVE_TOAST":if(void 0===t.toastId)return{...e,toasts:[]};return{...e,toasts:e.toasts.filter(e=>e.id!==t.toastId)}}},o=[],d={toasts:[]};function c(e){d=l(d,e),o.forEach(e=>{e(d)})}function u(e){let{...t}=e,a=(n=(n+1)%Number.MAX_VALUE).toString(),s=()=>c({type:"DISMISS_TOAST",toastId:a});return c({type:"ADD_TOAST",toast:{...t,id:a,open:!0,onOpenChange:e=>{e||s()}}}),{id:a,dismiss:s,update:e=>c({type:"UPDATE_TOAST",toast:{...e,id:a}})}}function f(){let[e,t]=s.useState(d);return s.useEffect(()=>(o.push(t),()=>{let e=o.indexOf(t);e>-1&&o.splice(e,1)}),[e]),{...e,toast:u,dismiss:e=>c({type:"DISMISS_TOAST",toastId:e})}}},2141:function(e,t,a){"use strict";a.d(t,{O:function(){return s}});let s=(0,a(93777).eI)("https://kronhxyuinsrsoezbtni.supabase.co","eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtyb25oeHl1aW5zcnNvZXpidG5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5NTkxMzQsImV4cCI6MjA1MTUzNTEzNH0.AFL2xKo1lasYJPwURdCKkEp_BWudW-8vDmEY6w2MY1I")},94508:function(e,t,a){"use strict";a.d(t,{S:function(){return i},cn:function(){return r}});var s=a(61994),n=a(53335);function r(){for(var e=arguments.length,t=Array(e),a=0;a<e;a++)t[a]=arguments[a];return(0,n.m6)((0,s.W)(t))}function i(){return"/edgarai"}},30401:function(e,t,a){"use strict";a.d(t,{Z:function(){return s}});let s=(0,a(39763).Z)("Check",[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]])},10407:function(e,t,a){"use strict";a.d(t,{Z:function(){return s}});let s=(0,a(39763).Z)("ChevronRight",[["path",{d:"m9 18 6-6-6-6",key:"mthhwq"}]])},56266:function(e,t,a){"use strict";a.d(t,{Z:function(){return s}});let s=(0,a(39763).Z)("MoreHorizontal",[["circle",{cx:"12",cy:"12",r:"1",key:"41hilf"}],["circle",{cx:"19",cy:"12",r:"1",key:"1wjl8i"}],["circle",{cx:"5",cy:"12",r:"1",key:"1pcz8c"}]])},67822:function(e,t,a){"use strict";a.d(t,{B:function(){return o}});var s=a(2265),n=a(73966),r=a(98575),i=a(37053),l=a(57437);function o(e){let t=e+"CollectionProvider",[a,o]=(0,n.b)(t),[d,c]=a(t,{collectionRef:{current:null},itemMap:new Map}),u=e=>{let{scope:t,children:a}=e,n=s.useRef(null),r=s.useRef(new Map).current;return(0,l.jsx)(d,{scope:t,itemMap:r,collectionRef:n,children:a})};u.displayName=t;let f=e+"CollectionSlot",m=s.forwardRef((e,t)=>{let{scope:a,children:s}=e,n=c(f,a),o=(0,r.e)(t,n.collectionRef);return(0,l.jsx)(i.g7,{ref:o,children:s})});m.displayName=f;let p=e+"CollectionItemSlot",x="data-radix-collection-item",h=s.forwardRef((e,t)=>{let{scope:a,children:n,...o}=e,d=s.useRef(null),u=(0,r.e)(t,d),f=c(p,a);return s.useEffect(()=>(f.itemMap.set(d,{ref:d,...o}),()=>void f.itemMap.delete(d))),(0,l.jsx)(i.g7,{[x]:"",ref:u,children:n})});return h.displayName=p,[{Provider:u,Slot:m,ItemSlot:h},function(t){let a=c(e+"CollectionConsumer",t);return s.useCallback(()=>{let e=a.collectionRef.current;if(!e)return[];let t=Array.from(e.querySelectorAll("[".concat(x,"]")));return Array.from(a.itemMap.values()).sort((e,a)=>t.indexOf(e.ref.current)-t.indexOf(a.ref.current))},[a.collectionRef,a.itemMap])},o]}},29114:function(e,t,a){"use strict";a.d(t,{gm:function(){return r}});var s=a(2265);a(57437);var n=s.createContext(void 0);function r(e){let t=s.useContext(n);return e||t||"ltr"}}},function(e){e.O(0,[6137,3777,4384,6008,3026,4116,7648,1218,2971,2117,1744],function(){return e(e.s=47057)}),_N_E=e.O()}]);