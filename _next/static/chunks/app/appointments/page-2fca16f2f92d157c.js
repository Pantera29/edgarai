(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[64],{49735:function(e,t,n){Promise.resolve().then(n.bind(n,12281))},12281:function(e,t,n){"use strict";n.r(t),n.d(t,{default:function(){return AppointmentsPage}});var s=n(57437),r=n(2265),a=n(64072),i=n(62067),o=n.n(i);n(76176);var l=n(23611),d=n(62031),c=n(35831),u=n(61465);o().locale("en-GB");let f=(0,a.Zt)(o()),m=[{id:1,title:"Oil Change - John Doe",start:new Date(2023,5,15,10,0),end:new Date(2023,5,15,11,0)},{id:2,title:"Tire Rotation - Jane Smith",start:new Date(2023,5,16,14,0),end:new Date(2023,5,16,15,0)}];function AppointmentsPage(){let[e,t]=(0,r.useState)(null);return(0,s.jsxs)("div",{className:"container mx-auto py-10",children:[(0,s.jsx)("h1",{className:"text-2xl font-bold mb-4",children:"Service Appointments"}),(0,s.jsx)("div",{className:"mb-4",children:(0,s.jsxs)(d.Vq,{children:[(0,s.jsx)(d.hg,{asChild:!0,children:(0,s.jsx)(l.z,{children:"Add New Appointment"})}),(0,s.jsxs)(d.cZ,{className:"sm:max-w-[425px]",children:[(0,s.jsxs)(d.fK,{children:[(0,s.jsx)(d.$N,{children:"Add New Appointment"}),(0,s.jsx)(d.Be,{children:"Enter the details for the new service appointment."})]}),(0,s.jsxs)("div",{className:"grid gap-4 py-4",children:[(0,s.jsxs)("div",{className:"grid grid-cols-4 items-center gap-4",children:[(0,s.jsx)(u._,{htmlFor:"customer",className:"text-right",children:"Customer"}),(0,s.jsx)(c.I,{id:"customer",className:"col-span-3"})]}),(0,s.jsxs)("div",{className:"grid grid-cols-4 items-center gap-4",children:[(0,s.jsx)(u._,{htmlFor:"service",className:"text-right",children:"Service"}),(0,s.jsx)(c.I,{id:"service",className:"col-span-3"})]}),(0,s.jsxs)("div",{className:"grid grid-cols-4 items-center gap-4",children:[(0,s.jsx)(u._,{htmlFor:"date",className:"text-right",children:"Date"}),(0,s.jsx)(c.I,{id:"date",type:"date",className:"col-span-3"})]}),(0,s.jsxs)("div",{className:"grid grid-cols-4 items-center gap-4",children:[(0,s.jsx)(u._,{htmlFor:"time",className:"text-right",children:"Time"}),(0,s.jsx)(c.I,{id:"time",type:"time",className:"col-span-3"})]})]}),(0,s.jsx)(d.cN,{children:(0,s.jsx)(l.z,{type:"submit",children:"Save Appointment"})})]})]})}),(0,s.jsx)(a.f,{localizer:f,events:m,startAccessor:"start",endAccessor:"end",style:{height:500},onSelectEvent:e=>{t(e)}}),e&&(0,s.jsx)(d.Vq,{open:!!e,onOpenChange:()=>t(null),children:(0,s.jsxs)(d.cZ,{children:[(0,s.jsx)(d.fK,{children:(0,s.jsx)(d.$N,{children:e.title})}),(0,s.jsxs)("div",{className:"grid gap-4 py-4",children:[(0,s.jsxs)("div",{children:["Start: ",o()(e.start).format("LLLL")]}),(0,s.jsxs)("div",{children:["End: ",o()(e.end).format("LLLL")]})]}),(0,s.jsx)(d.cN,{children:(0,s.jsx)(l.z,{onClick:()=>t(null),children:"Close"})})]})})]})}},23611:function(e,t,n){"use strict";n.d(t,{z:function(){return d}});var s=n(57437),r=n(2265),a=n(67256),i=n(96061),o=n(81628);let l=(0,i.j)("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",{variants:{variant:{default:"bg-primary text-primary-foreground shadow hover:bg-primary/90",destructive:"bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",outline:"border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",secondary:"bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",ghost:"hover:bg-accent hover:text-accent-foreground",link:"text-primary underline-offset-4 hover:underline"},size:{default:"h-9 px-4 py-2",sm:"h-8 rounded-md px-3 text-xs",lg:"h-10 rounded-md px-8",icon:"h-9 w-9"}},defaultVariants:{variant:"default",size:"default"}}),d=r.forwardRef((e,t)=>{let{className:n,variant:r,size:i,asChild:d=!1,...c}=e,u=d?a.g7:"button";return(0,s.jsx)(u,{className:(0,o.cn)(l({variant:r,size:i,className:n})),ref:t,...c})});d.displayName="Button"},62031:function(e,t,n){"use strict";n.d(t,{$N:function(){return m},Be:function(){return p},Vq:function(){return l},cN:function(){return DialogFooter},cZ:function(){return f},fK:function(){return DialogHeader},hg:function(){return d}});var s=n(57437),r=n(2265),a=n(28712),i=n(82549),o=n(81628);let l=a.fC,d=a.xz,c=a.h_;a.x8;let u=r.forwardRef((e,t)=>{let{className:n,...r}=e;return(0,s.jsx)(a.aV,{ref:t,className:(0,o.cn)("fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",n),...r})});u.displayName=a.aV.displayName;let f=r.forwardRef((e,t)=>{let{className:n,children:r,...l}=e;return(0,s.jsxs)(c,{children:[(0,s.jsx)(u,{}),(0,s.jsxs)(a.VY,{ref:t,className:(0,o.cn)("fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",n),...l,children:[r,(0,s.jsxs)(a.x8,{className:"absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground",children:[(0,s.jsx)(i.Z,{className:"h-4 w-4"}),(0,s.jsx)("span",{className:"sr-only",children:"Close"})]})]})]})});f.displayName=a.VY.displayName;let DialogHeader=e=>{let{className:t,...n}=e;return(0,s.jsx)("div",{className:(0,o.cn)("flex flex-col space-y-1.5 text-center sm:text-left",t),...n})};DialogHeader.displayName="DialogHeader";let DialogFooter=e=>{let{className:t,...n}=e;return(0,s.jsx)("div",{className:(0,o.cn)("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",t),...n})};DialogFooter.displayName="DialogFooter";let m=r.forwardRef((e,t)=>{let{className:n,...r}=e;return(0,s.jsx)(a.Dx,{ref:t,className:(0,o.cn)("text-lg font-semibold leading-none tracking-tight",n),...r})});m.displayName=a.Dx.displayName;let p=r.forwardRef((e,t)=>{let{className:n,...r}=e;return(0,s.jsx)(a.dk,{ref:t,className:(0,o.cn)("text-sm text-muted-foreground",n),...r})});p.displayName=a.dk.displayName},35831:function(e,t,n){"use strict";n.d(t,{I:function(){return i}});var s=n(57437),r=n(2265),a=n(81628);let i=r.forwardRef((e,t)=>{let{className:n,type:r,...i}=e;return(0,s.jsx)("input",{type:r,className:(0,a.cn)("flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",n),ref:t,...i})});i.displayName="Input"},61465:function(e,t,n){"use strict";n.d(t,{_:function(){return d}});var s=n(57437),r=n(2265),a=n(36743),i=n(96061),o=n(81628);let l=(0,i.j)("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"),d=r.forwardRef((e,t)=>{let{className:n,...r}=e;return(0,s.jsx)(a.f,{ref:t,className:(0,o.cn)(l(),n),...r})});d.displayName=a.f.displayName},81628:function(e,t,n){"use strict";n.d(t,{cn:function(){return cn}});var s=n(57042),r=n(74769);function cn(){for(var e=arguments.length,t=Array(e),n=0;n<e;n++)t[n]=arguments[n];return(0,r.m6)((0,s.W)(t))}},60075:function(e,t,n){"use strict";function _typeof(e){return(_typeof="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}n.d(t,{Z:function(){return _typeof}})}},function(e){e.O(0,[856,990,360,503,201,467,169,971,472,744],function(){return e(e.s=49735)}),_N_E=e.O()}]);