(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[8458],{7976:function(e,a,s){Promise.resolve().then(s.bind(s,40687))},40687:function(e,a,s){"use strict";s.r(a),s.d(a,{default:function(){return $}});var t=s(57437),n=s(2265),i=s(10928),r=s(70236),o=s(89048),l=s(62869),c=s(70112),d=s(42208),u=s(35974),m=s(26110),p=s(53647),h=s(2141),f=s(77992);let x=[{value:"pendiente",label:"Pendiente"},{value:"pagado",label:"Pagado"},{value:"anulado",label:"Anulado"}];function v(e){let{transactionId:a,currentStatus:s,onUpdate:i}=e,{toast:r}=(0,f.pm)(),[o,l]=(0,n.useState)(!1),c=async e=>{l(!0);try{console.log("Actualizando estado a:",e);let{error:n}=await h.O.from("transacciones_servicio").update({estado:e}).eq("id_transaccion",a);if(n)throw n;if("pagado"===e){var s,t;console.log("Obteniendo datos del cliente para:",a);let{data:e,error:n}=await h.O.from("transacciones_servicio").select("\n            citas:id_cita (\n              clientes:cliente_id_uuid (\n                id_uuid\n              )\n            )\n          ").eq("id_transaccion",a).single();if(n)throw console.error("Error al obtener cliente:",n),n;console.log("Datos obtenidos:",e);let i=null==e?void 0:null===(t=e.citas)||void 0===t?void 0:null===(s=t.clientes)||void 0===s?void 0:s.id_uuid;if(!i)throw console.error("No se encontr\xf3 el ID del cliente en:",e),Error("No se pudo obtener el ID del cliente");console.log("ID del cliente:",i);let{data:r,error:o}=await h.O.from("nps").select("id").eq("transaccion_id",a).maybeSingle();if(o)throw console.error("Error al verificar NPS existente:",o),o;if(r)console.log("Ya existe un NPS para esta transacci\xf3n");else{console.log("Creando nuevo NPS para transacci\xf3n:",a);let{error:e}=await h.O.from("nps").insert({transaccion_id:a,cliente_id:i,estado:"pendiente"});if(e)throw console.error("Error al crear NPS:",e),e;console.log("NPS creado exitosamente")}}r({title:"Estado actualizado",description:"El estado de la transacci\xf3n ha sido actualizado exitosamente."}),i&&i()}catch(e){console.error("Error completo:",e),r({variant:"destructive",title:"Error",description:e.message||"No se pudo actualizar el estado de la transacci\xf3n"})}finally{l(!1)}};return(0,t.jsxs)(p.Ph,{value:s,onValueChange:c,disabled:o,children:[(0,t.jsx)(p.i4,{className:"w-[130px]",children:(0,t.jsx)(p.ki,{children:(0,t.jsx)(u.C,{variant:"pagado"===s?"success":"pendiente"===s?"warning":"destructive",children:s})})}),(0,t.jsx)(p.Bw,{children:x.map(e=>(0,t.jsx)(p.Ql,{value:e.value,children:e.label},e.value))})]})}var j=s(27648);function g(e){var a,s,n,i;let{transaction:l}=e;return(0,t.jsxs)("div",{className:"space-y-4",children:[(0,t.jsxs)("div",{className:"grid grid-cols-2 gap-4",children:[(0,t.jsxs)("div",{children:[(0,t.jsx)("h4",{className:"font-medium",children:"Cliente"}),(0,t.jsx)("p",{children:null===(s=l.citas)||void 0===s?void 0:null===(a=s.clientes)||void 0===a?void 0:a.nombre})]}),(0,t.jsxs)("div",{children:[(0,t.jsx)("h4",{className:"font-medium",children:"Fecha"}),(0,t.jsx)("p",{children:(0,r.Z)(new Date(l.fecha_transaccion),"PPP",{locale:o.Z})})]}),(0,t.jsxs)("div",{children:[(0,t.jsx)("h4",{className:"font-medium",children:"Estado de Pago"}),(0,t.jsx)(u.C,{variant:"pagado"===l.estado?"success":"pendiente"===l.estado?"warning":"destructive",children:l.estado})]}),(0,t.jsxs)("div",{children:[(0,t.jsx)("h4",{className:"font-medium",children:"Total"}),(0,t.jsxs)("p",{children:["$",null===(n=l.transaccion_productos)||void 0===n?void 0:n.reduce((e,a)=>e+a.cantidad_usada*a.precio_unitario,0).toLocaleString()]})]})]}),(0,t.jsxs)("div",{children:[(0,t.jsx)("h4",{className:"font-medium mb-2",children:"Productos"}),(0,t.jsx)("div",{className:"border rounded-lg divide-y",children:null===(i=l.transaccion_productos)||void 0===i?void 0:i.map(e=>{var a;return(0,t.jsxs)("div",{className:"p-2 flex justify-between",children:[(0,t.jsx)("span",{children:null===(a=e.productos)||void 0===a?void 0:a.nombre}),(0,t.jsxs)("div",{className:"space-x-4",children:[(0,t.jsxs)("span",{children:["x",e.cantidad_usada]}),(0,t.jsxs)("span",{children:["$",(e.cantidad_usada*e.precio_unitario).toLocaleString()]})]})]},e.id_producto)})})]}),l.notas&&(0,t.jsxs)("div",{children:[(0,t.jsx)("h4",{className:"font-medium",children:"Notas"}),(0,t.jsx)("p",{children:l.notas})]})]})}let N=[{accessorKey:"fecha_transaccion",header:"Fecha",cell:e=>{let{row:a}=e;return(0,r.Z)(new Date(a.getValue("fecha_transaccion")),"PPP",{locale:o.Z})}},{accessorKey:"citas.clientes.nombre",header:"Cliente",cell:e=>{var a,s;let{row:t}=e;return(null===(s=t.original.citas)||void 0===s?void 0:null===(a=s.clientes)||void 0===a?void 0:a.nombre)||"-"}},{accessorKey:"estado",header:"Estado de Pago",cell:e=>{let{row:a}=e;return(0,t.jsx)(v,{transactionId:a.original.id_transaccion,currentStatus:a.getValue("estado"),onUpdate:()=>{let e=document.querySelector('[data-table-key="transacciones"]');if(e){let a=new Event("refresh");e.dispatchEvent(a)}}})}},{accessorKey:"total",header:"Total",cell:e=>{var a;let{row:s}=e,t=(null===(a=s.original.transaccion_productos)||void 0===a?void 0:a.reduce((e,a)=>e+a.cantidad_usada*a.precio_unitario,0))||0;return"$".concat(t.toLocaleString())}},{accessorKey:"productos",header:"Productos",cell:e=>{let{row:a}=e,[s,i]=(0,n.useState)(!1),r=a.original.transaccion_productos||[];return(0,t.jsxs)("div",{className:"text-sm",children:[(0,t.jsxs)(l.z,{variant:"ghost",className:"h-auto p-0 font-normal",onClick:()=>i(!s),children:[r.length," ",1===r.length?"producto":"productos"]}),s&&(0,t.jsx)("div",{className:"mt-2 space-y-1",children:r.map(e=>{var a;return(0,t.jsxs)("div",{className:"ml-4",children:[null===(a=e.productos)||void 0===a?void 0:a.nombre," x ",e.cantidad_usada]},e.id_producto)})})]})}},{accessorKey:"nps",header:"NPS",cell:e=>{let{row:a}=e,[s,i]=(0,n.useState)(null),[r,o]=(0,n.useState)(!0);return((0,n.useEffect)(()=>{(async()=>{let{data:e,error:s}=await h.O.from("nps").select("*").eq("transaccion_id",a.original.id_transaccion).maybeSingle();!s&&e&&i(e),o(!1)})()},[a.original.id_transaccion]),r)?(0,t.jsx)("div",{className:"animate-pulse h-4 w-20 bg-muted rounded"}):s?(0,t.jsx)("div",{className:"flex items-center gap-2",children:"pendiente"===s.estado?(0,t.jsx)(u.C,{variant:"secondary",children:"Encuesta pendiente"}):(0,t.jsxs)(j.default,{href:"/feedback?id=".concat(s.id),className:"flex items-center gap-1 hover:underline",children:[(0,t.jsxs)("span",{children:[s.puntaje,"/10"]}),(0,t.jsx)("span",{children:"-"}),(0,t.jsx)(u.C,{variant:"promotor"===s.clasificacion?"success":"neutral"===s.clasificacion?"warning":"destructive",children:s.clasificacion}),(0,t.jsx)(c.Z,{className:"h-4 w-4 text-muted-foreground"})]})}):(0,t.jsx)("span",{className:"text-muted-foreground",children:"Sin NPS"})}},{id:"actions",cell:e=>{let{row:a}=e,[s,i]=(0,n.useState)(!1);return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(l.z,{variant:"ghost",size:"icon",onClick:()=>i(!0),children:(0,t.jsx)(d.Z,{className:"h-4 w-4"})}),(0,t.jsx)(m.Vq,{open:s,onOpenChange:i,children:(0,t.jsxs)(m.cZ,{children:[(0,t.jsx)(m.fK,{children:(0,t.jsx)(m.$N,{children:"Detalles de la Transacci\xf3n"})}),(0,t.jsx)(g,{transaction:a.original})]})})]})}}];var _=s(13590),b=s(29501),y=s(31229),w=s(95186),S=s(26815),P=s(76818),E=s(14438),k=s(63628);let D=y.Ry({id_cita:y.Z_().uuid(),estado_pago:y.Km(["pendiente","pagado","anulado"]),notas:y.Z_().optional(),productos:y.IX(y.Ry({id_producto:y.Z_().uuid(),cantidad:y.Rx().positive()}))});function C(e){let{appointmentId:a,onSuccess:s}=e,[i,o]=(0,n.useState)(!1),[c,d]=(0,n.useState)([]),[u,m]=(0,n.useState)([]),[f,x]=(0,n.useState)(a||""),v=(0,b.cI)({resolver:(0,_.F)(D),defaultValues:{id_cita:a,estado_pago:"pendiente",notas:"",productos:[]}});(0,n.useEffect)(()=>{let e=async()=>{let{data:e,error:a}=await h.O.from("citas").select("\n          *,\n          clientes (\n            id_uuid,\n            nombre\n          ),\n          vehiculos (\n            id_uuid,\n            marca,\n            modelo,\n            placa\n          ),\n          servicios (\n            id_uuid,\n            nombre,\n            duracion_estimada\n          )\n        ").eq("estado","completada").order("fecha_hora",{ascending:!1});if(a){console.error("Error al cargar citas:",a);return}m(e||[])};a||e()},[a]);let j=async e=>{o(!0);try{let{data:a,error:t}=await h.O.from("transacciones_servicio").insert({id_cita:e.id_cita,estado:e.estado_pago,fecha_transaccion:new Date().toISOString(),notas:e.notas}).select().single();if(t)throw t;for(let e of c){let{data:s,error:t}=await h.O.from("productos").select("stock_actual").eq("id_producto",e.id_producto).single();if(t)throw t;let{error:n}=await h.O.from("transaccion_productos").insert({id_transaccion:a.id_transaccion,id_producto:e.id_producto,cantidad_usada:e.cantidad,precio_unitario:e.precio_unitario});if(n)throw n;let{error:i}=await h.O.from("productos").update({stock_actual:s.stock_actual-e.cantidad}).eq("id_producto",e.id_producto);if(i)throw i}E.Am.success("Transacci\xf3n creada exitosamente"),null==s||s(),v.reset(),d([])}catch(e){console.error("Error al crear la transacci\xf3n:",e),E.Am.error(e.message||"Error al crear la transacci\xf3n")}finally{o(!1)}};return(0,t.jsxs)("form",{onSubmit:v.handleSubmit(j),className:"space-y-6",children:[!a&&(0,t.jsxs)("div",{className:"space-y-2",children:[(0,t.jsx)(S._,{children:"Cita"}),(0,t.jsxs)(p.Ph,{value:f,onValueChange:e=>{x(e),v.setValue("id_cita",e)},children:[(0,t.jsx)(p.i4,{children:(0,t.jsx)(p.ki,{placeholder:"Seleccione una cita completada"})}),(0,t.jsx)(p.Bw,{children:u.map(e=>{var a,s,n,i;return(0,t.jsxs)(p.Ql,{value:e.id_uuid,children:[(0,r.Z)(new Date(e.fecha_hora),"dd/MM/yyyy HH:mm")," - ",(null===(a=e.clientes)||void 0===a?void 0:a.nombre)||"Cliente no disponible","(",null===(s=e.vehiculos)||void 0===s?void 0:s.marca," ",null===(n=e.vehiculos)||void 0===n?void 0:n.modelo,(null===(i=e.vehiculos)||void 0===i?void 0:i.placa)?" (".concat(e.vehiculos.placa,")"):"",")"]},e.id_uuid)})})]})]}),(0,t.jsxs)("div",{className:"space-y-2",children:[(0,t.jsx)(S._,{children:"Productos Utilizados"}),(0,t.jsx)(k.q,{onSelect:e=>{let a=v.getValues("productos");if(a.find(a=>a.id_producto===e.id_producto)){E.Am.error("Este producto ya fue agregado");return}d([...c,e]),v.setValue("productos",[...a,{id_producto:e.id_producto,cantidad:e.cantidad}])}}),c.length>0&&(0,t.jsxs)("div",{className:"border rounded-md p-4 space-y-2 mt-2",children:[c.map(e=>(0,t.jsxs)("div",{className:"flex justify-between items-center",children:[(0,t.jsx)("span",{children:e.nombre}),(0,t.jsxs)("div",{className:"flex items-center gap-4",children:[(0,t.jsx)(w.I,{type:"number",min:"1",className:"w-20",value:e.cantidad,onChange:a=>{let s=Number(a.target.value);d(c.map(a=>a.id_producto===e.id_producto?{...a,cantidad:s,subtotal:s*a.precio_unitario}:a));let t=v.getValues("productos");v.setValue("productos",t.map(a=>a.id_producto===e.id_producto?{...a,cantidad:s}:a))}}),(0,t.jsxs)("span",{children:["$",e.subtotal]}),(0,t.jsx)(l.z,{variant:"ghost",size:"sm",onClick:()=>{d(c.filter(a=>a.id_producto!==e.id_producto));let a=v.getValues("productos");v.setValue("productos",a.filter(a=>a.id_producto!==e.id_producto))},children:"Eliminar"})]})]},e.id_producto)),(0,t.jsx)("div",{className:"flex justify-end border-t pt-2",children:(0,t.jsxs)("span",{className:"font-bold",children:["Total: $",c.reduce((e,a)=>e+a.subtotal,0)]})})]})]}),(0,t.jsxs)("div",{className:"space-y-2",children:[(0,t.jsx)(S._,{children:"Estado de Pago"}),(0,t.jsxs)(p.Ph,{value:v.watch("estado_pago"),onValueChange:e=>v.setValue("estado_pago",e),children:[(0,t.jsx)(p.i4,{children:(0,t.jsx)(p.ki,{placeholder:"Seleccione estado"})}),(0,t.jsxs)(p.Bw,{children:[(0,t.jsx)(p.Ql,{value:"pendiente",children:"Pendiente"}),(0,t.jsx)(p.Ql,{value:"pagado",children:"Pagado"}),(0,t.jsx)(p.Ql,{value:"anulado",children:"Anulado"})]})]})]}),(0,t.jsxs)("div",{className:"space-y-2",children:[(0,t.jsx)(S._,{children:"Notas"}),(0,t.jsx)(P.g,{...v.register("notas"),placeholder:"Agregue notas adicionales aqu\xed..."})]}),(0,t.jsx)(l.z,{type:"submit",disabled:i,children:i?"Guardando...":"Crear Transacci\xf3n"})]})}var T=s(99376),O=s(1098),V=s(57054),A=s(31047),I=s(32489),Z=s(12339),z=s(71931);let q=[{value:"todos",label:"Todas"},{value:"pendiente",label:"Pendientes"},{value:"pagado",label:"Pagadas"},{value:"anulado",label:"Anuladas"}];function R(){var e,a,s;let c=(0,T.useSearchParams)().get("id_cita"),[d,u]=(0,n.useState)(!1),[p,x]=(0,n.useState)(!1),{toast:v}=(0,f.pm)(),[j,g]=(0,n.useState)([]),[_,b]=(0,n.useState)(0),[y,S]=(0,n.useState)({startDate:null,endDate:null,estado:"",cliente:""}),[P,E]=(0,n.useState)({count:0,amount:0}),[k,D]=(0,n.useState)(!1),[R,$]=(0,n.useState)(null),F={startDate:null,endDate:null,estado:"todos",cliente:""};(0,n.useEffect)(()=>{c&&x(!0)},[c]);let M=(0,z.y1)(e=>{L(0)},500),K=e=>{let a={...y,...e};S(a),""===e.cliente||"todos"===e.estado||null===e.startDate||null===e.endDate?L(0):M(a)},L=async e=>{u(!0);try{let{data:e,error:a}=await h.O.from("transacciones_servicio").select("\n          *,\n          citas (\n            id_uuid,\n            fecha_hora,\n            clientes (\n              nombre\n            ),\n            vehiculos (\n              marca,\n              modelo,\n              placa\n            )\n          ),\n          transaccion_productos (\n            cantidad_usada,\n            precio_unitario,\n            productos (\n              nombre\n            )\n          )\n        ").order("fecha_transaccion",{ascending:!1});if(a)throw a;let s=(null==e?void 0:e.reduce((e,a)=>{var s;let t=(null===(s=a.transaccion_productos)||void 0===s?void 0:s.reduce((e,a)=>e+a.cantidad_usada*a.precio_unitario,0))||0;return e+t},0))||0;E({count:(null==e?void 0:e.length)||0,amount:s}),g(e||[]),b(Math.ceil(((null==e?void 0:e.length)||0)/10))}catch(e){console.error("Error:",e),v({variant:"destructive",title:"Error",description:"Error al cargar las transacciones"})}finally{u(!1)}};return(0,n.useEffect)(()=>{L(0)},[]),(0,t.jsxs)("div",{className:"container mx-auto py-10",children:[(0,t.jsxs)("div",{className:"flex justify-between items-center mb-8",children:[(0,t.jsxs)("div",{children:[(0,t.jsx)("h2",{className:"text-3xl font-bold tracking-tight",children:"Transacciones"}),(0,t.jsxs)("p",{className:"text-muted-foreground mt-2",children:[P.count," transacciones, Total: $",P.amount.toLocaleString()]})]}),(0,t.jsx)(l.z,{onClick:()=>x(!0),children:"Nueva Transacci\xf3n"})]}),(0,t.jsxs)("div",{className:"grid grid-cols-2 gap-4 mb-6",children:[(0,t.jsxs)("div",{className:"space-y-2",children:[(0,t.jsx)("label",{className:"text-sm font-medium",children:"Fecha Inicio"}),(0,t.jsxs)(V.J2,{children:[(0,t.jsx)(V.xo,{asChild:!0,children:(0,t.jsxs)(l.z,{variant:"outline",className:"w-full justify-start",children:[(0,t.jsx)(A.Z,{className:"mr-2 h-4 w-4"}),y.startDate?(0,r.Z)(y.startDate,"PPP",{locale:o.Z}):"Seleccionar"]})}),(0,t.jsx)(V.yk,{className:"w-auto p-0",children:(0,t.jsx)(O.f,{mode:"single",selected:y.startDate||void 0,onSelect:e=>K({startDate:e}),initialFocus:!0})})]})]}),(0,t.jsxs)("div",{className:"space-y-2",children:[(0,t.jsx)("label",{className:"text-sm font-medium",children:"Fecha Fin"}),(0,t.jsxs)(V.J2,{children:[(0,t.jsx)(V.xo,{asChild:!0,children:(0,t.jsxs)(l.z,{variant:"outline",className:"w-full justify-start",children:[(0,t.jsx)(A.Z,{className:"mr-2 h-4 w-4"}),y.endDate?(0,r.Z)(y.endDate,"PPP",{locale:o.Z}):"Seleccionar"]})}),(0,t.jsx)(V.yk,{className:"w-auto p-0",children:(0,t.jsx)(O.f,{mode:"single",selected:y.endDate||void 0,onSelect:e=>K({endDate:e}),initialFocus:!0})})]})]})]}),(0,t.jsxs)("div",{className:"flex items-center space-x-4 mb-6",children:[(0,t.jsx)("div",{className:"flex-1",children:(0,t.jsx)(w.I,{placeholder:"Buscar por cliente...",value:y.cliente,onChange:e=>K({cliente:e.target.value})})}),(0,t.jsx)(Z.mQ,{value:y.estado,onValueChange:e=>K({estado:e}),children:(0,t.jsx)(Z.dr,{children:q.map(e=>(0,t.jsx)(Z.SP,{value:e.value,children:e.label},e.value))})}),(""!==y.cliente||"todos"!==y.estado||null!==y.startDate||null!==y.endDate)&&(0,t.jsxs)(l.z,{variant:"ghost",size:"sm",onClick:()=>{S(F),L(0)},className:"h-8 px-2",children:[(0,t.jsx)(I.Z,{className:"h-4 w-4 mr-2"}),"Limpiar filtros"]})]}),d?(0,t.jsx)("div",{className:"space-y-3",children:Array.from({length:5}).map((e,a)=>(0,t.jsxs)("div",{className:"flex items-center space-x-4",children:[(0,t.jsx)("div",{className:"h-4 bg-muted rounded w-32 animate-pulse"}),(0,t.jsx)("div",{className:"h-4 bg-muted rounded w-48 animate-pulse"}),(0,t.jsx)("div",{className:"h-4 bg-muted rounded w-24 animate-pulse"}),(0,t.jsx)("div",{className:"h-4 bg-muted rounded w-20 animate-pulse"})]},a))}):(0,t.jsx)(i.w,{columns:N,data:j,pageCount:_,onPaginationChange:e=>L(e)}),(0,t.jsx)(m.Vq,{open:p,onOpenChange:x,children:(0,t.jsxs)(m.cZ,{className:"max-w-3xl",children:[(0,t.jsx)(m.fK,{children:(0,t.jsx)(m.$N,{children:"Nueva Transacci\xf3n"})}),(0,t.jsx)(C,{appointmentId:c||"",onSuccess:()=>{x(!1);let e=document.querySelector('[data-table-key="transacciones"]');if(e){let a=new Event("refresh");e.dispatchEvent(a)}}})]})}),(0,t.jsx)(m.Vq,{open:k,onOpenChange:D,children:(0,t.jsxs)(m.cZ,{className:"max-w-3xl",children:[(0,t.jsx)(m.fK,{children:(0,t.jsx)(m.$N,{children:"Detalles de la Transacci\xf3n"})}),(0,t.jsxs)("div",{className:"space-y-4",children:[(0,t.jsxs)("div",{className:"grid grid-cols-2 gap-4",children:[(0,t.jsxs)("div",{children:[(0,t.jsx)("h4",{className:"font-medium",children:"Cliente"}),(0,t.jsx)("p",{children:null==R?void 0:null===(a=R.citas)||void 0===a?void 0:null===(e=a.clientes)||void 0===e?void 0:e.nombre})]}),(0,t.jsxs)("div",{children:[(0,t.jsx)("h4",{className:"font-medium",children:"Fecha"}),(0,t.jsx)("p",{children:(null==R?void 0:R.fecha_transaccion)?(0,r.Z)(new Date(R.fecha_transaccion),"dd/MM/yyyy HH:mm"):"Fecha no disponible"})]})]}),(0,t.jsxs)("div",{children:[(0,t.jsx)("h4",{className:"font-medium mb-2",children:"Productos"}),(0,t.jsx)("div",{className:"border rounded-md divide-y",children:null==R?void 0:null===(s=R.transaccion_productos)||void 0===s?void 0:s.map((e,a)=>(0,t.jsxs)("div",{className:"p-3 flex justify-between items-center",children:[(0,t.jsx)("span",{children:e.productos.nombre}),(0,t.jsxs)("div",{className:"flex items-center gap-4",children:[(0,t.jsxs)("span",{children:[e.cantidad_usada," unidades"]}),(0,t.jsxs)("span",{children:["$",e.precio_unitario]}),(0,t.jsxs)("span",{className:"font-medium",children:["$",(e.cantidad_usada*e.precio_unitario).toLocaleString()]})]})]},a))})]})]})]})})]})}function $(){return(0,t.jsx)(n.Suspense,{fallback:(0,t.jsx)("div",{className:"container mx-auto py-10",children:(0,t.jsx)("div",{className:"space-y-3",children:Array.from({length:5}).map((e,a)=>(0,t.jsxs)("div",{className:"flex items-center space-x-4",children:[(0,t.jsx)("div",{className:"h-4 bg-muted rounded w-32 animate-pulse"}),(0,t.jsx)("div",{className:"h-4 bg-muted rounded w-48 animate-pulse"}),(0,t.jsx)("div",{className:"h-4 bg-muted rounded w-24 animate-pulse"}),(0,t.jsx)("div",{className:"h-4 bg-muted rounded w-20 animate-pulse"})]},a))})}),children:(0,t.jsx)(R,{})})}},26110:function(e,a,s){"use strict";s.d(a,{$N:function(){return f},Be:function(){return x},Vq:function(){return l},cN:function(){return h},cZ:function(){return m},fK:function(){return p},hg:function(){return c}});var t=s(57437),n=s(2265),i=s(49027),r=s(32489),o=s(94508);let l=i.fC,c=i.xz,d=i.h_;i.x8;let u=n.forwardRef((e,a)=>{let{className:s,...n}=e;return(0,t.jsx)(i.aV,{ref:a,className:(0,o.cn)("fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",s),...n})});u.displayName=i.aV.displayName;let m=n.forwardRef((e,a)=>{let{className:s,children:n,...l}=e;return(0,t.jsxs)(d,{children:[(0,t.jsx)(u,{}),(0,t.jsxs)(i.VY,{ref:a,className:(0,o.cn)("fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",s),...l,children:[n,(0,t.jsxs)(i.x8,{className:"absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground",children:[(0,t.jsx)(r.Z,{className:"h-4 w-4"}),(0,t.jsx)("span",{className:"sr-only",children:"Close"})]})]})]})});m.displayName=i.VY.displayName;let p=e=>{let{className:a,...s}=e;return(0,t.jsx)("div",{className:(0,o.cn)("flex flex-col space-y-1.5 text-center sm:text-left",a),...s})};p.displayName="DialogHeader";let h=e=>{let{className:a,...s}=e;return(0,t.jsx)("div",{className:(0,o.cn)("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",a),...s})};h.displayName="DialogFooter";let f=n.forwardRef((e,a)=>{let{className:s,...n}=e;return(0,t.jsx)(i.Dx,{ref:a,className:(0,o.cn)("text-lg font-semibold leading-none tracking-tight",s),...n})});f.displayName=i.Dx.displayName;let x=n.forwardRef((e,a)=>{let{className:s,...n}=e;return(0,t.jsx)(i.dk,{ref:a,className:(0,o.cn)("text-sm text-muted-foreground",s),...n})});x.displayName=i.dk.displayName},95186:function(e,a,s){"use strict";s.d(a,{I:function(){return r}});var t=s(57437),n=s(2265),i=s(94508);let r=n.forwardRef((e,a)=>{let{className:s,type:n,...r}=e;return(0,t.jsx)("input",{type:n,className:(0,i.cn)("flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300",s),ref:a,...r})});r.displayName="Input"},26815:function(e,a,s){"use strict";s.d(a,{_:function(){return o}});var t=s(57437),n=s(2265),i=s(6394),r=s(94508);let o=n.forwardRef((e,a)=>{let{className:s,...n}=e;return(0,t.jsx)(i.f,{ref:a,className:(0,r.cn)("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",s),...n})});o.displayName=i.f.displayName},12339:function(e,a,s){"use strict";s.d(a,{SP:function(){return c},dr:function(){return l},mQ:function(){return o},nU:function(){return d}});var t=s(57437),n=s(2265),i=s(20271),r=s(94508);let o=i.fC,l=n.forwardRef((e,a)=>{let{className:s,...n}=e;return(0,t.jsx)(i.aV,{ref:a,className:(0,r.cn)("inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",s),...n})});l.displayName=i.aV.displayName;let c=n.forwardRef((e,a)=>{let{className:s,...n}=e;return(0,t.jsx)(i.xz,{ref:a,className:(0,r.cn)("inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",s),...n})});c.displayName=i.xz.displayName;let d=n.forwardRef((e,a)=>{let{className:s,...n}=e;return(0,t.jsx)(i.VY,{ref:a,className:(0,r.cn)("mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",s),...n})});d.displayName=i.VY.displayName},76818:function(e,a,s){"use strict";s.d(a,{g:function(){return r}});var t=s(57437),n=s(2265),i=s(94508);let r=n.forwardRef((e,a)=>{let{className:s,...n}=e;return(0,t.jsx)("textarea",{className:(0,i.cn)("flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",s),ref:a,...n})});r.displayName="Textarea"},77992:function(e,a,s){"use strict";s.d(a,{pm:function(){return m}});var t=s(2265);let n=0,i=new Map,r=e=>{if(i.has(e))return;let a=setTimeout(()=>{i.delete(e),d({type:"REMOVE_TOAST",toastId:e})},1e6);i.set(e,a)},o=(e,a)=>{switch(a.type){case"ADD_TOAST":return{...e,toasts:[a.toast,...e.toasts].slice(0,1)};case"UPDATE_TOAST":return{...e,toasts:e.toasts.map(e=>e.id===a.toast.id?{...e,...a.toast}:e)};case"DISMISS_TOAST":{let{toastId:s}=a;return s?r(s):e.toasts.forEach(e=>{r(e.id)}),{...e,toasts:e.toasts.map(e=>e.id===s||void 0===s?{...e,open:!1}:e)}}case"REMOVE_TOAST":if(void 0===a.toastId)return{...e,toasts:[]};return{...e,toasts:e.toasts.filter(e=>e.id!==a.toastId)}}},l=[],c={toasts:[]};function d(e){c=o(c,e),l.forEach(e=>{e(c)})}function u(e){let{...a}=e,s=(n=(n+1)%Number.MAX_VALUE).toString(),t=()=>d({type:"DISMISS_TOAST",toastId:s});return d({type:"ADD_TOAST",toast:{...a,id:s,open:!0,onOpenChange:e=>{e||t()}}}),{id:s,dismiss:t,update:e=>d({type:"UPDATE_TOAST",toast:{...e,id:s}})}}function m(){let[e,a]=t.useState(c);return t.useEffect(()=>(l.push(a),()=>{let e=l.indexOf(a);e>-1&&l.splice(e,1)}),[e]),{...e,toast:u,dismiss:e=>d({type:"DISMISS_TOAST",toastId:e})}}},63628:function(e,a,s){"use strict";s.d(a,{q:function(){return l}});var t=s(57437),n=s(2265),i=s(53647),r=s(2141),o=s(15863);function l(e){let{onSelect:a}=e,[s,l]=(0,n.useState)([]),[c,d]=(0,n.useState)(!1);return(0,n.useEffect)(()=>{(async()=>{d(!0);try{let{data:e,error:a}=await r.O.from("productos").select("id_producto, nombre, precio, stock_actual").gt("stock_actual",0).order("nombre");if(a)throw a;l(e||[])}catch(e){console.error("Error cargando productos:",e)}finally{d(!1)}})()},[]),(0,t.jsx)("div",{className:"space-y-1",children:(0,t.jsxs)(i.Ph,{onValueChange:e=>{let t=s.find(a=>a.id_producto===e);t&&a({id_producto:t.id_producto,nombre:t.nombre,cantidad:1,precio_unitario:t.precio,subtotal:t.precio})},children:[(0,t.jsxs)(i.i4,{className:"w-full",children:[(0,t.jsx)(i.ki,{placeholder:c?"Cargando productos...":"Seleccione un producto"}),c&&(0,t.jsx)(o.Z,{className:"h-4 w-4 animate-spin"})]}),(0,t.jsx)(i.Bw,{children:(0,t.jsxs)(i.DI,{children:[(0,t.jsx)(i.n5,{className:"text-sm font-medium text-muted-foreground px-2 py-1.5",children:"Productos Disponibles"}),s.map(e=>(0,t.jsxs)(i.Ql,{value:e.id_producto,className:"flex justify-between items-center gap-4",children:[(0,t.jsxs)("div",{className:"flex flex-col",children:[(0,t.jsx)("span",{className:"font-medium",children:e.nombre}),(0,t.jsxs)("span",{className:"text-sm text-muted-foreground",children:["Stock: ",e.stock_actual]})]}),(0,t.jsxs)("span",{className:"text-sm font-semibold",children:["$",e.precio.toLocaleString()]})]},e.id_producto)),0===s.length&&!c&&(0,t.jsx)("div",{className:"px-2 py-4 text-sm text-center text-muted-foreground",children:"No hay productos disponibles"})]})})]})})}}},function(e){e.O(0,[9903,8325,4384,6008,8001,6320,51,7648,8385,3556,5237,4973,6772,9793,2971,2117,1744],function(){return e(e.s=7976)}),_N_E=e.O()}]);