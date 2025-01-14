(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[410],{46612:function(e,a,t){Promise.resolve().then(t.bind(t,51360))},51360:function(e,a,t){"use strict";t.r(a),t.d(a,{default:function(){return CitasPage}});var s=t(57437),i=t(2265),r=t(23611),l=t(35831),n=t(66005),d=t(62031),o=t(61465),c=t(71271),u=t(14150),x=t(7532),m=t(64072),h=t(69539),f=t(12654),p=t(14800),j=t(38771),g=t(46445);t(76176);var v=t(60745),N=t(45487),_=t(28203),b=t(6141),w=t(20173),y=t(65958),C=t(17472),P=t(49598),T=t(25646),S=t(13082),k=t(61396),Z=t.n(k);let I={es:g.Z},z=(0,m.lD)({format:h.Z,parse:f.Z,startOfWeek:p.Z,getDay:j.Z,locales:I});function CitasPage(){let{toast:e}=(0,c.pm)(),[a,t]=(0,i.useState)([]),[f,p]=(0,i.useState)([]),[j,k]=(0,i.useState)([]),[I,E]=(0,i.useState)(!1),[K,D]=(0,i.useState)(!1),[V,R]=(0,i.useState)({cliente_id_uuid:"",servicio_id_uuid:"",fecha_hora:"",estado:"pendiente",notas:""}),[F,O]=(0,i.useState)("lista"),[Q,Y]=(0,i.useState)(""),[A,U]=(0,i.useState)("todos"),q=(0,S.createClientComponentClient)(),cargarDatos=async()=>{try{let{data:e,error:a}=await q.from("clientes").select("id_uuid, nombre");if(a)throw a;let{data:s,error:i}=await q.from("servicios").select("id_uuid, nombre, duracion_estimada");if(i)throw i;let{data:r,error:l}=await q.from("citas").select("\n          id_uuid,\n          cliente_id_uuid,\n          servicio_id_uuid,\n          vehiculo_id_uuid,\n          fecha_hora,\n          estado,\n          notas,\n          created_at,\n          clientes!citas_cliente_id_uuid_fkey (\n            id_uuid,\n            nombre\n          ),\n          servicios!citas_servicio_id_uuid_fkey (\n            id_uuid,\n            nombre,\n            duracion_estimada\n          ),\n          vehiculos!citas_vehiculo_id_uuid_fkey (\n            id_uuid,\n            marca,\n            modelo,\n            placa\n          )\n        ").order("fecha_hora",{ascending:!0});if(l)throw l;p(e||[]),k(s||[]),t(r||[])}catch(a){console.error("Error al cargar datos:",a),e({variant:"destructive",title:"Error",description:"No se pudieron cargar los datos"})}};(0,i.useEffect)(()=>{cargarDatos()},[]);let handleSubmit=async a=>{a.preventDefault();let t=j.find(e=>e.id_uuid===V.servicio_id_uuid);if(!t)return;let s=await verificarDisponibilidad(V.fecha_hora,t.duracion_estimada);if(!s){e({variant:"destructive",title:"Horario no disponible",description:"Ya existe una cita programada en este horario"});return}D(!0);try{let a={cliente_id_uuid:V.cliente_id_uuid,servicio_id_uuid:V.servicio_id_uuid,fecha_hora:V.fecha_hora,estado:V.estado,notas:V.notas},{error:t}=await q.from("citas").insert([a]);if(t)throw t;await cargarDatos(),e({title:"Cita agendada",description:"La cita se ha registrado correctamente"}),E(!1),R({cliente_id_uuid:"",servicio_id_uuid:"",fecha_hora:"",estado:"pendiente",notas:""})}catch(a){console.error("Error:",a),e({variant:"destructive",title:"Error",description:"Hubo un problema al agendar la cita"})}finally{D(!1)}};(0,i.useEffect)(()=>{console.log("Estado actualizado - clientes:",f),console.log("Estado actualizado - servicios:",j)},[f,j]);let verificarDisponibilidad=async(e,a)=>{let t=new Date(e),s=new Date(t.getTime()+6e4*a),{data:i}=await q.from("citas").select("fecha_hora, servicios!inner(duracion_estimada)").neq("estado","cancelada").gte("fecha_hora",t.toISOString()).lte("fecha_hora",s.toISOString());return!i||0===i.length},B=a.filter(e=>{let a="todos"===A||e.estado===A,t=!Q||e.fecha_hora.startsWith(Q);return a&&t}),handleUpdateEstado=async(s,i)=>{let r=await new Promise(e=>{let a="\xbfEst\xe1s seguro de que deseas cambiar el estado de la cita a ".concat(i,"?");e(window.confirm(a))});if(r)try{let{data:r,error:l}=await q.from("citas").update({estado:i}).eq("uuid id",s).select();if(l)throw l;t(a.map(e=>e.id_uuid===s?{...e,estado:i}:e)),e({title:"Estado actualizado",description:"La cita ha sido marcada como ".concat(i)})}catch(a){e({variant:"destructive",title:"Error",description:"No se pudo actualizar el estado"})}},getKPIs=()=>{let e=a.length,t=a.filter(e=>"pendiente"===e.estado).length,s=a.filter(e=>"confirmada"===e.estado).length,i=a.filter(e=>"completada"===e.estado).length,r=a.filter(e=>"cancelada"===e.estado).length;return{total:e,pendiente:t,confirmada:s,completada:i,cancelada:r}};return(0,s.jsxs)("div",{className:"container mx-auto py-10",children:[(0,s.jsx)("h1",{className:"text-2xl font-bold mb-4",children:"Agenda de Citas"}),(0,s.jsxs)("div",{className:"flex justify-between items-center mb-4",children:[(0,s.jsxs)("div",{className:"flex gap-4",children:[(0,s.jsx)(l.I,{type:"date",value:Q,onChange:e=>Y(e.target.value),className:"w-auto"}),(0,s.jsxs)(x.Ph,{value:A,onValueChange:U,children:[(0,s.jsx)(x.i4,{className:"w-[180px]",children:(0,s.jsx)(x.ki,{placeholder:"Estado"})}),(0,s.jsxs)(x.Bw,{children:[(0,s.jsx)(x.Ql,{value:"todos",children:"Todos"}),(0,s.jsx)(x.Ql,{value:"pendiente",children:"Pendiente"}),(0,s.jsx)(x.Ql,{value:"confirmada",children:"Confirmada"}),(0,s.jsx)(x.Ql,{value:"completada",children:"Completada"}),(0,s.jsx)(x.Ql,{value:"cancelada",children:"Cancelada"})]})]})]}),(0,s.jsx)(r.z,{onClick:()=>E(!0),children:"Agendar Nueva Cita"})]}),(0,s.jsxs)("div",{className:"grid grid-cols-5 gap-4 mb-6",children:[(0,s.jsxs)(P.Zb,{children:[(0,s.jsxs)(T.Tooltip,{children:[(0,s.jsx)(T.TooltipTrigger,{asChild:!0,children:(0,s.jsxs)(P.Ol,{className:"flex flex-row items-center justify-between space-y-0 pb-2 cursor-help",children:[(0,s.jsx)(P.ll,{className:"text-sm font-medium",children:"Total Citas"}),(0,s.jsx)(_.Z,{className:"h-4 w-4 text-gray-600"})]})}),(0,s.jsx)(T.TooltipContent,{children:(0,s.jsx)("p",{children:"Total de citas registradas en el sistema"})})]}),(0,s.jsxs)(P.aY,{children:[(0,s.jsx)("div",{className:"text-2xl font-bold",children:getKPIs().total}),(0,s.jsx)("p",{className:"text-xs text-muted-foreground",children:"100% del total"})]})]}),(0,s.jsxs)(P.Zb,{children:[(0,s.jsxs)(T.Tooltip,{children:[(0,s.jsx)(T.TooltipTrigger,{asChild:!0,children:(0,s.jsxs)(P.Ol,{className:"flex flex-row items-center justify-between space-y-0 pb-2 cursor-help",children:[(0,s.jsx)(P.ll,{className:"text-sm font-medium",children:"Pendientes"}),(0,s.jsx)(b.Z,{className:"mr-2 h-4 w-4"})]})}),(0,s.jsxs)(T.TooltipContent,{children:[(0,s.jsx)("p",{children:"Citas que a\xfan no han sido confirmadas"}),(0,s.jsxs)("p",{className:"text-xs text-muted-foreground mt-1",children:["\xdaltimo mes: ",getKPIs().pendiente||0," citas"]})]})]}),(0,s.jsxs)(P.aY,{children:[(0,s.jsx)("div",{className:"text-2xl font-bold text-yellow-600",children:getKPIs().pendiente||0}),(0,s.jsxs)("p",{className:"text-xs text-muted-foreground",children:[((getKPIs().pendiente||0)/getKPIs().total*100).toFixed(1),"% del total"]})]})]}),(0,s.jsxs)(P.Zb,{children:[(0,s.jsxs)(T.Tooltip,{children:[(0,s.jsx)(T.TooltipTrigger,{asChild:!0,children:(0,s.jsxs)(P.Ol,{className:"flex flex-row items-center justify-between space-y-0 pb-2 cursor-help",children:[(0,s.jsx)(P.ll,{className:"text-sm font-medium",children:"Confirmadas"}),(0,s.jsx)(w.Z,{className:"mr-2 h-4 w-4"})]})}),(0,s.jsxs)(T.TooltipContent,{children:[(0,s.jsx)("p",{children:"Citas confirmadas pendientes de realizar"}),(0,s.jsxs)("p",{className:"text-xs text-muted-foreground mt-1",children:["\xdaltimo mes: ",getKPIs().confirmada||0," citas"]})]})]}),(0,s.jsxs)(P.aY,{children:[(0,s.jsx)("div",{className:"text-2xl font-bold text-blue-600",children:getKPIs().confirmada||0}),(0,s.jsxs)("p",{className:"text-xs text-muted-foreground",children:[((getKPIs().confirmada||0)/getKPIs().total*100).toFixed(1),"% del total"]})]})]}),(0,s.jsxs)(P.Zb,{children:[(0,s.jsxs)(T.Tooltip,{children:[(0,s.jsx)(T.TooltipTrigger,{asChild:!0,children:(0,s.jsxs)(P.Ol,{className:"flex flex-row items-center justify-between space-y-0 pb-2 cursor-help",children:[(0,s.jsx)(P.ll,{className:"text-sm font-medium",children:"Completadas"}),(0,s.jsx)(w.Z,{className:"mr-2 h-4 w-4"})]})}),(0,s.jsxs)(T.TooltipContent,{children:[(0,s.jsx)("p",{children:"Citas realizadas exitosamente"}),(0,s.jsxs)("p",{className:"text-xs text-muted-foreground mt-1",children:["\xdaltimo mes: ",getKPIs().completada||0," citas"]})]})]}),(0,s.jsxs)(P.aY,{children:[(0,s.jsx)("div",{className:"text-2xl font-bold text-green-600",children:getKPIs().completada||0}),(0,s.jsxs)("p",{className:"text-xs text-muted-foreground",children:[((getKPIs().completada||0)/getKPIs().total*100).toFixed(1),"% del total"]})]})]}),(0,s.jsxs)(P.Zb,{children:[(0,s.jsxs)(T.Tooltip,{children:[(0,s.jsx)(T.TooltipTrigger,{asChild:!0,children:(0,s.jsxs)(P.Ol,{className:"flex flex-row items-center justify-between space-y-0 pb-2 cursor-help",children:[(0,s.jsx)(P.ll,{className:"text-sm font-medium",children:"Canceladas"}),(0,s.jsx)(y.Z,{className:"mr-2 h-4 w-4"})]})}),(0,s.jsxs)(T.TooltipContent,{children:[(0,s.jsx)("p",{children:"Citas canceladas"}),(0,s.jsxs)("p",{className:"text-xs text-muted-foreground mt-1",children:["\xdaltimo mes: ",getKPIs().cancelada||0," citas"]})]})]}),(0,s.jsxs)(P.aY,{children:[(0,s.jsx)("div",{className:"text-2xl font-bold text-red-600",children:getKPIs().cancelada||0}),(0,s.jsxs)("p",{className:"text-xs text-muted-foreground",children:[((getKPIs().cancelada||0)/getKPIs().total*100).toFixed(1),"% del total"]})]})]})]}),(0,s.jsxs)(v.mQ,{value:F,onValueChange:e=>O(e),children:[(0,s.jsxs)(v.dr,{children:[(0,s.jsx)(v.SP,{value:"lista",children:"Vista Lista"}),(0,s.jsx)(v.SP,{value:"calendario",children:"Vista Calendario"})]}),(0,s.jsx)(v.nU,{value:"lista",children:(0,s.jsxs)(n.iA,{children:[(0,s.jsx)(n.xD,{children:(0,s.jsxs)(n.SC,{children:[(0,s.jsx)(n.ss,{children:"Cliente"}),(0,s.jsx)(n.ss,{children:"Servicio"}),(0,s.jsx)(n.ss,{children:"Veh\xedculo"}),(0,s.jsx)(n.ss,{children:"Fecha y Hora"}),(0,s.jsx)(n.ss,{children:"Estado"}),(0,s.jsx)(n.ss,{children:"Notas"}),(0,s.jsx)(n.ss,{className:"text-right",children:"Acciones"})]})}),(0,s.jsxs)(n.RM,{children:[B.map(e=>{var a,t,i,l,d;return(0,s.jsxs)(n.SC,{children:[(0,s.jsx)(n.pj,{children:null===(a=e.clientes)||void 0===a?void 0:a.nombre}),(0,s.jsx)(n.pj,{children:null===(t=e.servicios)||void 0===t?void 0:t.nombre}),(0,s.jsx)(n.pj,{children:(0,s.jsxs)(Z(),{href:"/vehiculos?id=".concat(e.vehiculo_id_uuid),className:"text-blue-600 hover:underline",children:[null===(i=e.vehiculos)||void 0===i?void 0:i.marca," ",null===(l=e.vehiculos)||void 0===l?void 0:l.modelo,(null===(d=e.vehiculos)||void 0===d?void 0:d.placa)&&" (".concat(e.vehiculos.placa,")")]})}),(0,s.jsx)(n.pj,{children:(0,h.Z)(new Date(e.fecha_hora),"PPP 'a las' p",{locale:g.Z})}),(0,s.jsx)(n.pj,{children:(0,s.jsx)("span",{className:"inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ".concat("completada"===e.estado?"bg-green-100 text-green-800":"cancelada"===e.estado?"bg-red-100 text-red-800":"confirmada"===e.estado?"bg-blue-100 text-blue-800":"bg-yellow-100 text-yellow-800"),children:e.estado})}),(0,s.jsx)(n.pj,{children:e.notas}),(0,s.jsx)(n.pj,{className:"text-right",children:(0,s.jsxs)(N.h_,{children:[(0,s.jsx)(N.$F,{asChild:!0,children:(0,s.jsx)(r.z,{variant:"ghost",className:"h-8 w-8 p-0",children:(0,s.jsx)(C.Z,{className:"h-4 w-4"})})}),(0,s.jsxs)(N.AW,{align:"end",children:[(0,s.jsx)(N.Xi,{onClick:()=>handleUpdateEstado(e.id_uuid,"confirmada"),children:"Confirmar"}),(0,s.jsx)(N.Xi,{onClick:()=>handleUpdateEstado(e.id_uuid,"completada"),children:"Completar"}),(0,s.jsx)(N.Xi,{onClick:()=>handleUpdateEstado(e.id_uuid,"cancelada"),children:"Cancelar"})]})]})})]},e.id_uuid)}),0===B.length&&(0,s.jsx)(n.SC,{children:(0,s.jsx)(n.pj,{colSpan:6,className:"text-center py-4",children:"No hay citas que mostrar"})})]})]})}),(0,s.jsx)(v.nU,{value:"calendario",children:(0,s.jsx)("div",{className:"h-[600px]",children:(0,s.jsx)(m.f,{localizer:z,events:B.map(e=>{var a,t,s;return{title:"".concat(null===(a=e.clientes)||void 0===a?void 0:a.nombre," - ").concat(null===(t=e.servicios)||void 0===t?void 0:t.nombre),start:new Date(e.fecha_hora),end:new Date(new Date(e.fecha_hora).getTime()+6e4*((null===(s=e.servicios)||void 0===s?void 0:s.duracion_estimada)||60)),resource:e}}),startAccessor:"start",endAccessor:"end",culture:"es",messages:{next:"Siguiente",previous:"Anterior",today:"Hoy",month:"Mes",week:"Semana",day:"D\xeda",agenda:"Agenda",date:"Fecha",time:"Hora",event:"Evento"}})})})]}),(0,s.jsx)(d.Vq,{open:I,onOpenChange:E,children:(0,s.jsxs)(d.cZ,{children:[(0,s.jsxs)(d.fK,{children:[(0,s.jsx)(d.$N,{children:"Agendar Nueva Cita"}),(0,s.jsx)(d.Be,{children:"Complete los datos de la cita. Todos los campos son obligatorios."})]}),(0,s.jsxs)("form",{onSubmit:handleSubmit,children:[(0,s.jsxs)("div",{className:"grid gap-4 py-4",children:[(0,s.jsxs)("div",{className:"grid grid-cols-4 items-center gap-4",children:[(0,s.jsx)(o._,{htmlFor:"cliente",className:"text-right",children:"Cliente"}),(0,s.jsxs)(x.Ph,{value:V.cliente_id_uuid,onValueChange:e=>R({...V,cliente_id_uuid:e}),children:[(0,s.jsx)(x.i4,{className:"col-span-3",children:(0,s.jsx)(x.ki,{placeholder:"Seleccione un cliente"})}),(0,s.jsx)(x.Bw,{children:f.map(e=>(0,s.jsx)(x.Ql,{value:e.id_uuid,children:e.nombre},e.id_uuid))})]})]}),(0,s.jsxs)("div",{className:"grid grid-cols-4 items-center gap-4",children:[(0,s.jsx)(o._,{htmlFor:"servicio",className:"text-right",children:"Servicio"}),(0,s.jsxs)(x.Ph,{value:V.servicio_id_uuid,onValueChange:e=>R({...V,servicio_id_uuid:e}),children:[(0,s.jsx)(x.i4,{className:"col-span-3",children:(0,s.jsx)(x.ki,{placeholder:"Seleccione un servicio"})}),(0,s.jsx)(x.Bw,{children:j.map(e=>(0,s.jsx)(x.Ql,{value:e.id_uuid,children:e.nombre},e.id_uuid))})]})]}),(0,s.jsxs)("div",{className:"grid grid-cols-4 items-center gap-4",children:[(0,s.jsx)(o._,{htmlFor:"fecha_hora",className:"text-right",children:"Fecha y Hora"}),(0,s.jsx)(l.I,{id:"fecha_hora",type:"datetime-local",className:"col-span-3",value:V.fecha_hora,onChange:e=>R({...V,fecha_hora:e.target.value}),required:!0})]}),(0,s.jsxs)("div",{className:"grid grid-cols-4 items-center gap-4",children:[(0,s.jsx)(o._,{htmlFor:"estado",className:"text-right",children:"Estado"}),(0,s.jsxs)(x.Ph,{value:V.estado,onValueChange:e=>R({...V,estado:e}),children:[(0,s.jsx)(x.i4,{className:"col-span-3",children:(0,s.jsx)(x.ki,{placeholder:"Seleccione un estado"})}),(0,s.jsxs)(x.Bw,{children:[(0,s.jsx)(x.Ql,{value:"pendiente",children:"Pendiente"}),(0,s.jsx)(x.Ql,{value:"confirmada",children:"Confirmada"}),(0,s.jsx)(x.Ql,{value:"completada",children:"Completada"}),(0,s.jsx)(x.Ql,{value:"cancelada",children:"Cancelada"})]})]})]}),(0,s.jsxs)("div",{className:"grid grid-cols-4 items-center gap-4",children:[(0,s.jsx)(o._,{htmlFor:"notas",className:"text-right",children:"Notas"}),(0,s.jsx)(l.I,{id:"notas",className:"col-span-3",value:V.notas,onChange:e=>R({...V,notas:e.target.value})})]})]}),(0,s.jsx)(d.cN,{children:(0,s.jsx)(r.z,{type:"submit",disabled:K,children:K?"Guardando...":"Agendar Cita"})})]})]})}),(0,s.jsx)(u.x,{})]})}},49598:function(e,a,t){"use strict";t.d(a,{Ol:function(){return n},SZ:function(){return o},Zb:function(){return l},aY:function(){return c},ll:function(){return d}});var s=t(57437),i=t(2265),r=t(81628);let l=i.forwardRef((e,a)=>{let{className:t,...i}=e;return(0,s.jsx)("div",{ref:a,className:(0,r.cn)("rounded-xl border bg-card text-card-foreground shadow",t),...i})});l.displayName="Card";let n=i.forwardRef((e,a)=>{let{className:t,...i}=e;return(0,s.jsx)("div",{ref:a,className:(0,r.cn)("flex flex-col space-y-1.5 p-6",t),...i})});n.displayName="CardHeader";let d=i.forwardRef((e,a)=>{let{className:t,...i}=e;return(0,s.jsx)("div",{ref:a,className:(0,r.cn)("font-semibold leading-none tracking-tight",t),...i})});d.displayName="CardTitle";let o=i.forwardRef((e,a)=>{let{className:t,...i}=e;return(0,s.jsx)("div",{ref:a,className:(0,r.cn)("text-sm text-muted-foreground",t),...i})});o.displayName="CardDescription";let c=i.forwardRef((e,a)=>{let{className:t,...i}=e;return(0,s.jsx)("div",{ref:a,className:(0,r.cn)("p-6 pt-0",t),...i})});c.displayName="CardContent";let u=i.forwardRef((e,a)=>{let{className:t,...i}=e;return(0,s.jsx)("div",{ref:a,className:(0,r.cn)("flex items-center p-6 pt-0",t),...i})});u.displayName="CardFooter"},7532:function(e,a,t){"use strict";t.d(a,{Bw:function(){return x},Ph:function(){return o},Ql:function(){return h},i4:function(){return u},ki:function(){return c}});var s=t(57437),i=t(2265),r=t(20663),l=t(83523),n=t(62442),d=t(81628);let o=r.fC;r.ZA;let c=r.B4,u=i.forwardRef((e,a)=>{let{className:t,children:i,...n}=e;return(0,s.jsxs)(r.xz,{ref:a,className:(0,d.cn)("flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",t),...n,children:[i,(0,s.jsx)(r.JO,{asChild:!0,children:(0,s.jsx)(l.Z,{className:"h-4 w-4 opacity-50"})})]})});u.displayName=r.xz.displayName;let x=i.forwardRef((e,a)=>{let{className:t,children:i,position:l="popper",...n}=e;return(0,s.jsx)(r.h_,{children:(0,s.jsx)(r.VY,{ref:a,className:(0,d.cn)("relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2","popper"===l&&"data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",t),position:l,...n,children:(0,s.jsx)(r.l_,{className:(0,d.cn)("p-1","popper"===l&&"h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"),children:i})})})});x.displayName=r.VY.displayName;let m=i.forwardRef((e,a)=>{let{className:t,...i}=e;return(0,s.jsx)(r.__,{ref:a,className:(0,d.cn)("py-1.5 pl-8 pr-2 text-sm font-semibold",t),...i})});m.displayName=r.__.displayName;let h=i.forwardRef((e,a)=>{let{className:t,children:i,...l}=e;return(0,s.jsxs)(r.ck,{ref:a,className:(0,d.cn)("relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",t),...l,children:[(0,s.jsx)("span",{className:"absolute left-2 flex h-3.5 w-3.5 items-center justify-center",children:(0,s.jsx)(r.wU,{children:(0,s.jsx)(n.Z,{className:"h-4 w-4"})})}),(0,s.jsx)(r.eT,{children:i})]})});h.displayName=r.ck.displayName;let f=i.forwardRef((e,a)=>{let{className:t,...i}=e;return(0,s.jsx)(r.Z0,{ref:a,className:(0,d.cn)("-mx-1 my-1 h-px bg-muted",t),...i})});f.displayName=r.Z0.displayName},60745:function(e,a,t){"use strict";t.d(a,{SP:function(){return o},dr:function(){return d},mQ:function(){return n},nU:function(){return c}});var s=t(57437),i=t(2265),r=t(34522),l=t(81628);let n=r.fC,d=i.forwardRef((e,a)=>{let{className:t,...i}=e;return(0,s.jsx)(r.aV,{ref:a,className:(0,l.cn)("inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",t),...i})});d.displayName=r.aV.displayName;let o=i.forwardRef((e,a)=>{let{className:t,...i}=e;return(0,s.jsx)(r.xz,{ref:a,className:(0,l.cn)("inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",t),...i})});o.displayName=r.xz.displayName;let c=i.forwardRef((e,a)=>{let{className:t,...i}=e;return(0,s.jsx)(r.VY,{ref:a,className:(0,l.cn)("mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",t),...i})});c.displayName=r.VY.displayName},25646:function(e,a,t){"use strict";t.r(a),t.d(a,{Tooltip:function(){return d},TooltipContent:function(){return c},TooltipProvider:function(){return n},TooltipTrigger:function(){return o}});var s=t(57437),i=t(2265),r=t(98567),l=t(81628);let n=r.zt,d=r.fC,o=r.xz,c=i.forwardRef((e,a)=>{let{className:t,sideOffset:i=4,...n}=e;return(0,s.jsx)(r.VY,{ref:a,sideOffset:i,className:(0,l.cn)("z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",t),...n})});c.displayName=r.VY.displayName}},function(e){e.O(0,[856,660,682,863,108,82,584,396,620,160,467,169,361,586,685,971,472,744],function(){return e(e.s=46612)}),_N_E=e.O()}]);