(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[8458],{7976:function(e,t,a){Promise.resolve().then(a.bind(a,48731))},48731:function(e,t,a){"use strict";a.r(t),a.d(t,{default:function(){return ea}});var s=a(57437),r=a(2265),n=a(71594),o=a(24525),i=a(73578),d=a(62869);function l(e){var t;let{columns:a,data:l,pageCount:c,onPaginationChange:u}=e,[m,f]=(0,r.useState)(0),p=(0,n.b7)({data:l,columns:a,getCoreRowModel:(0,o.sC)(),getPaginationRowModel:(0,o.G_)(),pageCount:c,state:{pagination:{pageIndex:m,pageSize:10}},onPaginationChange:e=>{let t="function"==typeof e?e({pageIndex:m,pageSize:10}).pageIndex:e.pageIndex;f(t),null==u||u(t)},manualPagination:!0});return(0,s.jsxs)("div",{children:[(0,s.jsx)("div",{className:"rounded-md border",children:(0,s.jsxs)(i.iA,{children:[(0,s.jsx)(i.xD,{children:p.getHeaderGroups().map(e=>(0,s.jsx)(i.SC,{children:e.headers.map(e=>(0,s.jsx)(i.ss,{children:e.isPlaceholder?null:(0,n.ie)(e.column.columnDef.header,e.getContext())},e.id))},e.id))}),(0,s.jsx)(i.RM,{children:(null===(t=p.getRowModel().rows)||void 0===t?void 0:t.length)?p.getRowModel().rows.map(e=>(0,s.jsx)(i.SC,{"data-state":e.getIsSelected()&&"selected",children:e.getVisibleCells().map(e=>(0,s.jsx)(i.pj,{children:(0,n.ie)(e.column.columnDef.cell,e.getContext())},e.id))},e.id)):(0,s.jsx)(i.SC,{children:(0,s.jsx)(i.pj,{colSpan:a.length,className:"h-24 text-center",children:"No hay resultados."})})})]})}),(0,s.jsxs)("div",{className:"flex items-center justify-end space-x-2 py-4",children:[(0,s.jsx)(d.z,{variant:"outline",size:"sm",onClick:()=>p.previousPage(),disabled:!p.getCanPreviousPage(),children:"Anterior"}),(0,s.jsx)(d.z,{variant:"outline",size:"sm",onClick:()=>p.nextPage(),disabled:!p.getCanNextPage(),children:"Siguiente"})]})]})}var c=a(70236),u=a(89048),m=a(42208),f=a(35974),p=a(26110),x=a(24156),h=a(30401),g=a(94508),v=a(46343),b=a(73247);let j=r.forwardRef((e,t)=>{let{className:a,...r}=e;return(0,s.jsx)(v.mY,{ref:t,className:(0,g.cn)("flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",a),...r})});j.displayName=v.mY.displayName;let y=r.forwardRef((e,t)=>{let{className:a,...r}=e;return(0,s.jsxs)("div",{className:"flex items-center border-b px-3","cmdk-input-wrapper":"",children:[(0,s.jsx)(b.Z,{className:"mr-2 h-4 w-4 shrink-0 opacity-50"}),(0,s.jsx)(v.mY.Input,{ref:t,className:(0,g.cn)("flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",a),...r})]})});y.displayName=v.mY.Input.displayName,r.forwardRef((e,t)=>{let{className:a,...r}=e;return(0,s.jsx)(v.mY.List,{ref:t,className:(0,g.cn)("max-h-[300px] overflow-y-auto overflow-x-hidden",a),...r})}).displayName=v.mY.List.displayName;let N=r.forwardRef((e,t)=>(0,s.jsx)(v.mY.Empty,{ref:t,className:"py-6 text-center text-sm",...e}));N.displayName=v.mY.Empty.displayName;let w=r.forwardRef((e,t)=>{let{className:a,...r}=e;return(0,s.jsx)(v.mY.Group,{ref:t,className:(0,g.cn)("overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground",a),...r})});w.displayName=v.mY.Group.displayName,r.forwardRef((e,t)=>{let{className:a,...r}=e;return(0,s.jsx)(v.mY.Separator,{ref:t,className:(0,g.cn)("-mx-1 h-px bg-border",a),...r})}).displayName=v.mY.Separator.displayName;let _=r.forwardRef((e,t)=>{let{className:a,...r}=e;return(0,s.jsx)(v.mY.Item,{ref:t,className:(0,g.cn)("relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",a),...r})});_.displayName=v.mY.Item.displayName;var S=a(27312);let k=S.fC,C=S.xz;S.ee;let z=r.forwardRef((e,t)=>{let{className:a,align:r="center",sideOffset:n=4,...o}=e;return(0,s.jsx)(S.h_,{children:(0,s.jsx)(S.VY,{ref:t,align:r,sideOffset:n,className:(0,g.cn)("z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",a),...o})})});z.displayName=S.VY.displayName;var I=a(2141),R=a(14438);let P=[{value:"pendiente",label:"Pendiente"},{value:"pagado",label:"Pagado"},{value:"anulado",label:"Anulado"}];function D(e){let{transactionId:t,currentStatus:a,onUpdate:n}=e,[o,i]=(0,r.useState)(!1),[l,c]=(0,r.useState)(!1),u=async e=>{c(!0);try{let{error:a}=await I.O.from("transacciones_servicio").update({estado:e}).eq("id_transaccion",t);if(a)throw a;R.Am.success("Estado actualizado"),null==n||n()}catch(e){console.error("Error:",e),R.Am.error("Error al actualizar el estado")}finally{c(!1),i(!1)}};return(0,s.jsxs)(k,{open:o,onOpenChange:i,children:[(0,s.jsx)(C,{asChild:!0,children:(0,s.jsxs)(d.z,{variant:"ghost",role:"combobox","aria-expanded":o,className:"justify-between w-[150px]",disabled:l,children:[(0,s.jsx)(f.C,{variant:"pagado"===a?"success":"pendiente"===a?"warning":"destructive",children:a}),(0,s.jsx)(x.Z,{className:"ml-2 h-4 w-4 shrink-0 opacity-50"})]})}),(0,s.jsx)(z,{className:"w-[150px] p-0",children:(0,s.jsxs)(j,{children:[(0,s.jsx)(y,{placeholder:"Buscar estado..."}),(0,s.jsx)(N,{children:"No se encontr\xf3 el estado."}),(0,s.jsx)(w,{children:P.map(e=>(0,s.jsxs)(_,{value:e.value,onSelect:()=>u(e.value),children:[(0,s.jsx)(h.Z,{className:(0,g.cn)("mr-2 h-4 w-4",a===e.value?"opacity-100":"opacity-0")}),e.label]},e.value))})]})})]})}function E(e){var t,a,r,n;let{transaction:o}=e;return(0,s.jsxs)("div",{className:"space-y-4",children:[(0,s.jsxs)("div",{className:"grid grid-cols-2 gap-4",children:[(0,s.jsxs)("div",{children:[(0,s.jsx)("h4",{className:"font-medium",children:"Cliente"}),(0,s.jsx)("p",{children:null===(a=o.citas)||void 0===a?void 0:null===(t=a.clientes)||void 0===t?void 0:t.nombre})]}),(0,s.jsxs)("div",{children:[(0,s.jsx)("h4",{className:"font-medium",children:"Fecha"}),(0,s.jsx)("p",{children:(0,c.Z)(new Date(o.fecha_transaccion),"PPP",{locale:u.Z})})]}),(0,s.jsxs)("div",{children:[(0,s.jsx)("h4",{className:"font-medium",children:"Estado de Pago"}),(0,s.jsx)(f.C,{variant:"pagado"===o.estado?"success":"pendiente"===o.estado?"warning":"destructive",children:o.estado})]}),(0,s.jsxs)("div",{children:[(0,s.jsx)("h4",{className:"font-medium",children:"Total"}),(0,s.jsxs)("p",{children:["$",null===(r=o.transaccion_productos)||void 0===r?void 0:r.reduce((e,t)=>e+t.cantidad_usada*t.precio_unitario,0).toLocaleString()]})]})]}),(0,s.jsxs)("div",{children:[(0,s.jsx)("h4",{className:"font-medium mb-2",children:"Productos"}),(0,s.jsx)("div",{className:"border rounded-lg divide-y",children:null===(n=o.transaccion_productos)||void 0===n?void 0:n.map(e=>{var t;return(0,s.jsxs)("div",{className:"p-2 flex justify-between",children:[(0,s.jsx)("span",{children:null===(t=e.productos)||void 0===t?void 0:t.nombre}),(0,s.jsxs)("div",{className:"space-x-4",children:[(0,s.jsxs)("span",{children:["x",e.cantidad_usada]}),(0,s.jsxs)("span",{children:["$",(e.cantidad_usada*e.precio_unitario).toLocaleString()]})]})]},e.id_producto)})})]}),o.notas&&(0,s.jsxs)("div",{children:[(0,s.jsx)("h4",{className:"font-medium",children:"Notas"}),(0,s.jsx)("p",{children:o.notas})]})]})}let T=[{accessorKey:"fecha_transaccion",header:"Fecha",cell:e=>{let{row:t}=e;return(0,c.Z)(new Date(t.getValue("fecha_transaccion")),"PPP",{locale:u.Z})}},{accessorKey:"citas.clientes.nombre",header:"Cliente",cell:e=>{var t,a;let{row:s}=e;return(null===(a=s.original.citas)||void 0===a?void 0:null===(t=a.clientes)||void 0===t?void 0:t.nombre)||"-"}},{accessorKey:"estado",header:"Estado de Pago",cell:e=>{let{row:t}=e;return(0,s.jsx)(D,{transactionId:t.original.id_transaccion,currentStatus:t.getValue("estado"),onUpdate:()=>{let e=document.querySelector('[data-table-key="transacciones"]');if(e){let t=new Event("refresh");e.dispatchEvent(t)}}})}},{accessorKey:"total",header:"Total",cell:e=>{var t;let{row:a}=e,s=(null===(t=a.original.transaccion_productos)||void 0===t?void 0:t.reduce((e,t)=>e+t.cantidad_usada*t.precio_unitario,0))||0;return"$".concat(s.toLocaleString())}},{accessorKey:"productos",header:"Productos",cell:e=>{let{row:t}=e,[a,n]=(0,r.useState)(!1),o=t.original.transaccion_productos||[];return(0,s.jsxs)("div",{className:"text-sm",children:[(0,s.jsxs)(d.z,{variant:"ghost",className:"h-auto p-0 font-normal",onClick:()=>n(!a),children:[o.length," productos"]}),a&&(0,s.jsx)("div",{className:"mt-2 space-y-1",children:o.map(e=>{var t;return(0,s.jsxs)("div",{className:"ml-4",children:[null===(t=e.productos)||void 0===t?void 0:t.nombre," x ",e.cantidad_usada]},e.id_producto)})})]})}},{id:"actions",cell:e=>{let{row:t}=e,[a,n]=(0,r.useState)(!1);return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(d.z,{variant:"ghost",size:"icon",onClick:()=>n(!0),children:(0,s.jsx)(m.Z,{className:"h-4 w-4"})}),(0,s.jsx)(p.Vq,{open:a,onOpenChange:n,children:(0,s.jsxs)(p.cZ,{children:[(0,s.jsx)(p.fK,{children:(0,s.jsx)(p.$N,{children:"Detalles de la Transacci\xf3n"})}),(0,s.jsx)(E,{transaction:t.original})]})})]})}}];var V=a(77992),Z=a(13590),A=a(29501),O=a(31229),Y=a(95186),M=a(26815),F=a(53647);let q=r.forwardRef((e,t)=>{let{className:a,...r}=e;return(0,s.jsx)("textarea",{className:(0,g.cn)("flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",a),ref:t,...r})});q.displayName="Textarea";var L=a(15863);function B(e){let{onSelect:t}=e,[a,n]=(0,r.useState)([]),[o,i]=(0,r.useState)(!1);return(0,r.useEffect)(()=>{(async()=>{i(!0);try{let{data:e,error:t}=await I.O.from("productos").select("id_producto, nombre, precio, stock_actual").gt("stock_actual",0).order("nombre");if(t)throw t;n(e||[])}catch(e){console.error("Error cargando productos:",e)}finally{i(!1)}})()},[]),(0,s.jsx)("div",{className:"space-y-1",children:(0,s.jsxs)(F.Ph,{onValueChange:e=>{let s=a.find(t=>t.id_producto===e);s&&t({id_producto:s.id_producto,nombre:s.nombre,cantidad:1,precio_unitario:s.precio,subtotal:s.precio})},children:[(0,s.jsxs)(F.i4,{className:"w-full",children:[(0,s.jsx)(F.ki,{placeholder:o?"Cargando productos...":"Seleccione un producto"}),o&&(0,s.jsx)(L.Z,{className:"h-4 w-4 animate-spin"})]}),(0,s.jsx)(F.Bw,{children:(0,s.jsxs)(F.DI,{children:[(0,s.jsx)(F.n5,{className:"text-sm font-medium text-muted-foreground px-2 py-1.5",children:"Productos Disponibles"}),a.map(e=>(0,s.jsxs)(F.Ql,{value:e.id_producto,className:"flex justify-between items-center gap-4",children:[(0,s.jsxs)("div",{className:"flex flex-col",children:[(0,s.jsx)("span",{className:"font-medium",children:e.nombre}),(0,s.jsxs)("span",{className:"text-sm text-muted-foreground",children:["Stock: ",e.stock_actual]})]}),(0,s.jsxs)("span",{className:"text-sm font-semibold",children:["$",e.precio.toLocaleString()]})]},e.id_producto)),0===a.length&&!o&&(0,s.jsx)("div",{className:"px-2 py-4 text-sm text-center text-muted-foreground",children:"No hay productos disponibles"})]})})]})})}var K=a(95452);let U=O.Ry({id_cita:O.Z_().uuid(),estado_pago:O.Km(["pendiente","pagado","anulado"]),notas:O.Z_().optional(),productos:O.IX(O.Ry({id_producto:O.Z_().uuid(),cantidad:O.Rx().positive()}))});function Q(e){let{appointmentId:t,onSuccess:a}=e,[n,o]=(0,r.useState)(!1),[i,l]=(0,r.useState)([]),[u,m]=(0,r.useState)([]),[f,p]=(0,r.useState)(t||""),x=(0,A.cI)({resolver:(0,Z.F)(U),defaultValues:{id_cita:t,estado_pago:"pendiente",notas:"",productos:[]}});(0,r.useEffect)(()=>{let e=async()=>{console.log("Cargando citas completadas...");let{data:e,error:t}=await I.O.from("citas").select("\n          id_uuid,\n          fecha_hora,\n          clientes (\n            nombre,\n            telefono\n          ),\n          servicios (nombre),\n          vehiculos (\n            marca,\n            modelo,\n            placa\n          )\n        ").eq("estado","completada").order("fecha_hora",{ascending:!1});if(console.log("Respuesta:",{data:e,error:t}),t){console.error("Error cargando citas:",t);return}e&&(console.log("Citas cargadas:",e),m(e))};t||e()},[t]);let h=async e=>{o(!0);let t=(0,K.createClientComponentClient)();try{let{data:s,error:r}=await t.from("citas").select("estado").eq("id_uuid",e.id_cita).single();if(r)throw r;if("completada"!==s.estado)throw Error("La cita debe estar completada");let{data:n,error:o}=await t.from("transacciones_servicio").select("id_transaccion").eq("id_cita",e.id_cita).maybeSingle();if(o)throw o;if(n)throw Error("Ya existe una transacci\xf3n para esta cita");let{data:i,error:d}=await t.from("transacciones_servicio").insert({id_cita:e.id_cita,estado:e.estado_pago,notas:e.notas,fecha_transaccion:new Date().toISOString()}).select().single();if(d)throw d;for(let a of(console.log("Productos a procesar:",e.productos),e.productos)){console.log("Procesando producto:",a);let{data:e,error:s}=await t.from("productos").select("stock_actual, precio").eq("id_producto",a.id_producto).single();if(console.log("Stock data:",e),s)throw console.error("Error al verificar stock:",s),s;if(!e||e.stock_actual<a.cantidad)throw Error("Stock insuficiente para el producto ".concat(a.id_producto));let{data:r,error:n}=await t.from("transaccion_productos").insert({id_transaccion:i.id_transaccion,id_producto:a.id_producto,cantidad_usada:a.cantidad,precio_unitario:e.precio}).select();if(console.log("Resultado inserci\xf3n producto:",{productoData:r,productoError:n}),n)throw console.error("Error al insertar producto:",n),n;let{error:o}=await t.from("productos").update({stock_actual:e.stock_actual-a.cantidad}).eq("id_producto",a.id_producto);if(o)throw console.error("Error al actualizar stock:",o),o}R.Am.success("Transacci\xf3n creada correctamente"),x.reset(),null==a||a()}catch(e){console.error(e),R.Am.error(e.message||"Error al crear la transacci\xf3n")}finally{o(!1)}};return(0,s.jsxs)("form",{onSubmit:x.handleSubmit(h),className:"space-y-6",children:[!t&&(0,s.jsxs)("div",{className:"space-y-2",children:[(0,s.jsx)(M._,{children:"Cita"}),(0,s.jsxs)(F.Ph,{value:f,onValueChange:e=>{p(e),x.setValue("id_cita",e)},children:[(0,s.jsx)(F.i4,{children:(0,s.jsx)(F.ki,{placeholder:"Seleccione una cita completada"})}),(0,s.jsx)(F.Bw,{children:u.map(e=>(0,s.jsxs)(F.Ql,{value:e.id_uuid,children:[(0,c.Z)(new Date(e.fecha_hora),"dd/MM/yyyy HH:mm")," - ",e.clientes.nombre," - ",e.vehiculos.placa," - ",e.servicios.nombre]},e.id_uuid))})]})]}),(0,s.jsxs)("div",{className:"space-y-2",children:[(0,s.jsx)(M._,{children:"Productos Utilizados"}),(0,s.jsx)(B,{onSelect:e=>{let t=x.getValues("productos");if(t.find(t=>t.id_producto===e.id_producto)){R.Am.error("Este producto ya fue agregado");return}l([...i,e]),x.setValue("productos",[...t,{id_producto:e.id_producto,cantidad:e.cantidad}])}}),i.length>0&&(0,s.jsxs)("div",{className:"border rounded-md p-4 space-y-2 mt-2",children:[i.map(e=>(0,s.jsxs)("div",{className:"flex justify-between items-center",children:[(0,s.jsx)("span",{children:e.nombre}),(0,s.jsxs)("div",{className:"flex items-center gap-4",children:[(0,s.jsx)(Y.I,{type:"number",min:"1",className:"w-20",value:e.cantidad,onChange:t=>{let a=Number(t.target.value);l(i.map(t=>t.id_producto===e.id_producto?{...t,cantidad:a,subtotal:a*t.precio_unitario}:t));let s=x.getValues("productos");x.setValue("productos",s.map(t=>t.id_producto===e.id_producto?{...t,cantidad:a}:t))}}),(0,s.jsxs)("span",{children:["$",e.subtotal]}),(0,s.jsx)(d.z,{variant:"ghost",size:"sm",onClick:()=>{l(i.filter(t=>t.id_producto!==e.id_producto));let t=x.getValues("productos");x.setValue("productos",t.filter(t=>t.id_producto!==e.id_producto))},children:"Eliminar"})]})]},e.id_producto)),(0,s.jsx)("div",{className:"flex justify-end border-t pt-2",children:(0,s.jsxs)("span",{className:"font-bold",children:["Total: $",i.reduce((e,t)=>e+t.subtotal,0)]})})]})]}),(0,s.jsxs)("div",{className:"space-y-2",children:[(0,s.jsx)(M._,{children:"Estado de Pago"}),(0,s.jsxs)(F.Ph,{value:x.watch("estado_pago"),onValueChange:e=>x.setValue("estado_pago",e),children:[(0,s.jsx)(F.i4,{children:(0,s.jsx)(F.ki,{placeholder:"Seleccione estado"})}),(0,s.jsxs)(F.Bw,{children:[(0,s.jsx)(F.Ql,{value:"pendiente",children:"Pendiente"}),(0,s.jsx)(F.Ql,{value:"pagado",children:"Pagado"}),(0,s.jsx)(F.Ql,{value:"anulado",children:"Anulado"})]})]})]}),(0,s.jsxs)("div",{className:"space-y-2",children:[(0,s.jsx)(M._,{children:"Notas"}),(0,s.jsx)(q,{...x.register("notas"),placeholder:"Agregue notas adicionales aqu\xed..."})]}),(0,s.jsx)(d.z,{type:"submit",disabled:n,children:n?"Guardando...":"Crear Transacci\xf3n"})]})}var $=a(99376),J=a(1098),H=a(31047),G=a(32489),X=a(12339),W=a(71931);let ee=[{value:"todos",label:"Todas"},{value:"pendiente",label:"Pendientes"},{value:"pagado",label:"Pagadas"},{value:"anulado",label:"Anuladas"}];function et(){let e=(0,$.useSearchParams)().get("id_cita"),[t,a]=(0,r.useState)(!1),[n,o]=(0,r.useState)(!1),{toast:i}=(0,V.pm)(),[m,f]=(0,r.useState)([]),[x,h]=(0,r.useState)(0),[g,v]=(0,r.useState)({startDate:null,endDate:null,estado:"",cliente:""}),[b,j]=(0,r.useState)({count:0,amount:0}),y={startDate:null,endDate:null,estado:"todos",cliente:""};(0,r.useEffect)(()=>{e&&o(!0)},[e]);let N=(0,W.y1)(e=>{_(0)},500),w=e=>{let t={...g,...e};v(t),""===e.cliente||"todos"===e.estado||null===e.startDate||null===e.endDate?_(0):N(t)},_=async e=>{a(!0);try{let t=I.O.from("transacciones_servicio").select("\n          id_transaccion,\n          estado,\n          fecha_transaccion,\n          citas!inner (\n            clientes!inner (\n              nombre\n            )\n          ),\n          transaccion_productos!inner (\n            cantidad_usada,\n            precio_unitario\n          )\n        ",{count:"exact"});g.startDate&&(t=t.gte("fecha_transaccion",g.startDate.toISOString())),g.endDate&&(t=t.lte("fecha_transaccion",g.endDate.toISOString())),g.estado&&"todos"!==g.estado&&(t=t.eq("estado",g.estado)),g.cliente&&(t=t.textSearch("citas.clientes.nombre",g.cliente));let{data:a,error:s,count:r}=await t.range(10*e,(e+1)*10-1).order("fecha_transaccion",{ascending:!1});if(s)throw s;let n=(null==a?void 0:a.reduce((e,t)=>{var a;let s=(null===(a=t.transaccion_productos)||void 0===a?void 0:a.reduce((e,t)=>e+t.cantidad_usada*t.precio_unitario,0))||0;return e+s},0))||0;j({count:r||0,amount:n}),f(a||[]),h(Math.ceil((r||0)/10))}catch(e){console.error("Error:",e),i({variant:"destructive",title:"Error",description:"Error al cargar las transacciones"})}finally{a(!1)}};return(0,r.useEffect)(()=>{_(0)},[]),(0,s.jsxs)("div",{className:"container mx-auto py-10",children:[(0,s.jsxs)("div",{className:"flex justify-between items-center mb-8",children:[(0,s.jsxs)("div",{children:[(0,s.jsx)("h2",{className:"text-3xl font-bold tracking-tight",children:"Transacciones"}),(0,s.jsxs)("p",{className:"text-muted-foreground mt-2",children:[b.count," transacciones, Total: $",b.amount.toLocaleString()]})]}),(0,s.jsx)(d.z,{onClick:()=>o(!0),children:"Nueva Transacci\xf3n"})]}),(0,s.jsxs)("div",{className:"grid grid-cols-2 gap-4 mb-6",children:[(0,s.jsxs)("div",{className:"space-y-2",children:[(0,s.jsx)("label",{className:"text-sm font-medium",children:"Fecha Inicio"}),(0,s.jsxs)(k,{children:[(0,s.jsx)(C,{asChild:!0,children:(0,s.jsxs)(d.z,{variant:"outline",className:"w-full justify-start",children:[(0,s.jsx)(H.Z,{className:"mr-2 h-4 w-4"}),g.startDate?(0,c.Z)(g.startDate,"PPP",{locale:u.Z}):"Seleccionar"]})}),(0,s.jsx)(z,{className:"w-auto p-0",children:(0,s.jsx)(J.f,{mode:"single",selected:g.startDate||void 0,onSelect:e=>w({startDate:e}),initialFocus:!0})})]})]}),(0,s.jsxs)("div",{className:"space-y-2",children:[(0,s.jsx)("label",{className:"text-sm font-medium",children:"Fecha Fin"}),(0,s.jsxs)(k,{children:[(0,s.jsx)(C,{asChild:!0,children:(0,s.jsxs)(d.z,{variant:"outline",className:"w-full justify-start",children:[(0,s.jsx)(H.Z,{className:"mr-2 h-4 w-4"}),g.endDate?(0,c.Z)(g.endDate,"PPP",{locale:u.Z}):"Seleccionar"]})}),(0,s.jsx)(z,{className:"w-auto p-0",children:(0,s.jsx)(J.f,{mode:"single",selected:g.endDate||void 0,onSelect:e=>w({endDate:e}),initialFocus:!0})})]})]})]}),(0,s.jsxs)("div",{className:"flex items-center space-x-4 mb-6",children:[(0,s.jsx)("div",{className:"flex-1",children:(0,s.jsx)(Y.I,{placeholder:"Buscar por cliente...",value:g.cliente,onChange:e=>w({cliente:e.target.value})})}),(0,s.jsx)(X.mQ,{value:g.estado,onValueChange:e=>w({estado:e}),children:(0,s.jsx)(X.dr,{children:ee.map(e=>(0,s.jsx)(X.SP,{value:e.value,children:e.label},e.value))})}),(""!==g.cliente||"todos"!==g.estado||null!==g.startDate||null!==g.endDate)&&(0,s.jsxs)(d.z,{variant:"ghost",size:"sm",onClick:()=>{v(y),_(0)},className:"h-8 px-2",children:[(0,s.jsx)(G.Z,{className:"h-4 w-4 mr-2"}),"Limpiar filtros"]})]}),t?(0,s.jsx)("div",{className:"space-y-3",children:Array.from({length:5}).map((e,t)=>(0,s.jsxs)("div",{className:"flex items-center space-x-4",children:[(0,s.jsx)("div",{className:"h-4 bg-muted rounded w-32 animate-pulse"}),(0,s.jsx)("div",{className:"h-4 bg-muted rounded w-48 animate-pulse"}),(0,s.jsx)("div",{className:"h-4 bg-muted rounded w-24 animate-pulse"}),(0,s.jsx)("div",{className:"h-4 bg-muted rounded w-20 animate-pulse"})]},t))}):(0,s.jsx)(l,{columns:T,data:m,pageCount:x,onPaginationChange:e=>_(e)}),(0,s.jsx)(p.Vq,{open:n,onOpenChange:o,children:(0,s.jsxs)(p.cZ,{className:"max-w-3xl",children:[(0,s.jsx)(p.fK,{children:(0,s.jsx)(p.$N,{children:"Nueva Transacci\xf3n"})}),(0,s.jsx)(Q,{appointmentId:e||"",onSuccess:()=>{o(!1);let e=document.querySelector('[data-table-key="transacciones"]');if(e){let t=new Event("refresh");e.dispatchEvent(t)}}})]})})]})}function ea(){return(0,s.jsx)(r.Suspense,{fallback:(0,s.jsx)("div",{className:"container mx-auto py-10",children:(0,s.jsx)("div",{className:"space-y-3",children:Array.from({length:5}).map((e,t)=>(0,s.jsxs)("div",{className:"flex items-center space-x-4",children:[(0,s.jsx)("div",{className:"h-4 bg-muted rounded w-32 animate-pulse"}),(0,s.jsx)("div",{className:"h-4 bg-muted rounded w-48 animate-pulse"}),(0,s.jsx)("div",{className:"h-4 bg-muted rounded w-24 animate-pulse"}),(0,s.jsx)("div",{className:"h-4 bg-muted rounded w-20 animate-pulse"})]},t))})}),children:(0,s.jsx)(et,{})})}},35974:function(e,t,a){"use strict";a.d(t,{C:function(){return i}});var s=a(57437);a(2265);var r=a(90535),n=a(94508);let o=(0,r.j)("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",{variants:{variant:{default:"border-transparent bg-primary text-primary-foreground",secondary:"border-transparent bg-secondary text-secondary-foreground",destructive:"border-transparent bg-destructive text-destructive-foreground",outline:"text-foreground",success:"border-transparent bg-green-100 text-green-800",warning:"border-transparent bg-yellow-100 text-yellow-800",info:"border-transparent bg-blue-100 text-blue-800"}},defaultVariants:{variant:"default"}});function i(e){let{className:t,variant:a,...r}=e;return(0,s.jsx)("div",{className:(0,n.cn)(o({variant:a}),t),...r})}},62869:function(e,t,a){"use strict";a.d(t,{d:function(){return d},z:function(){return l}});var s=a(57437),r=a(2265),n=a(37053),o=a(90535),i=a(94508);let d=(0,o.j)("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",{variants:{variant:{default:"bg-primary text-primary-foreground shadow hover:bg-primary/90",destructive:"bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",outline:"border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",secondary:"bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",ghost:"hover:bg-accent hover:text-accent-foreground",link:"text-primary underline-offset-4 hover:underline"},size:{default:"h-9 px-4 py-2",sm:"h-8 rounded-md px-3 text-xs",lg:"h-10 rounded-md px-8",icon:"h-9 w-9"}},defaultVariants:{variant:"default",size:"default"}}),l=r.forwardRef((e,t)=>{let{className:a,variant:r,size:o,asChild:l=!1,...c}=e,u=l?n.g7:"button";return(0,s.jsx)(u,{className:(0,i.cn)(d({variant:r,size:o,className:a})),ref:t,...c})});l.displayName="Button"},1098:function(e,t,a){"use strict";a.d(t,{f:function(){return l}});var s=a(57437);a(2265);var r=a(92451),n=a(10407),o=a(78076),i=a(94508),d=a(62869);function l(e){let{className:t,classNames:a,showOutsideDays:l=!0,...c}=e;return(0,s.jsx)(o._W,{showOutsideDays:l,className:(0,i.cn)("p-3",t),classNames:{months:"flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",month:"space-y-4",caption:"flex justify-center pt-1 relative items-center",caption_label:"text-sm font-medium",nav:"space-x-1 flex items-center",nav_button:(0,i.cn)((0,d.d)({variant:"outline"}),"h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"),nav_button_previous:"absolute left-1",nav_button_next:"absolute right-1",table:"w-full border-collapse space-y-1",head_row:"flex",head_cell:"text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",row:"flex w-full mt-2",cell:(0,i.cn)("relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected].day-range-end)]:rounded-r-md","range"===c.mode?"[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md":"[&:has([aria-selected])]:rounded-md"),day:(0,i.cn)((0,d.d)({variant:"ghost"}),"h-8 w-8 p-0 font-normal aria-selected:opacity-100"),day_range_start:"day-range-start",day_range_end:"day-range-end",day_selected:"bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",day_today:"bg-accent text-accent-foreground",day_outside:"day-outside text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground",day_disabled:"text-muted-foreground opacity-50",day_range_middle:"aria-selected:bg-accent aria-selected:text-accent-foreground",day_hidden:"invisible",...a},components:{IconLeft:e=>{let{className:t,...a}=e;return(0,s.jsx)(r.Z,{className:(0,i.cn)("h-4 w-4",t),...a})},IconRight:e=>{let{className:t,...a}=e;return(0,s.jsx)(n.Z,{className:(0,i.cn)("h-4 w-4",t),...a})}},...c})}l.displayName="Calendar"},26110:function(e,t,a){"use strict";a.d(t,{$N:function(){return x},Be:function(){return h},Vq:function(){return d},cN:function(){return p},cZ:function(){return m},fK:function(){return f},hg:function(){return l}});var s=a(57437),r=a(2265),n=a(49027),o=a(32489),i=a(94508);let d=n.fC,l=n.xz,c=n.h_;n.x8;let u=r.forwardRef((e,t)=>{let{className:a,...r}=e;return(0,s.jsx)(n.aV,{ref:t,className:(0,i.cn)("fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",a),...r})});u.displayName=n.aV.displayName;let m=r.forwardRef((e,t)=>{let{className:a,children:r,...d}=e;return(0,s.jsxs)(c,{children:[(0,s.jsx)(u,{}),(0,s.jsxs)(n.VY,{ref:t,className:(0,i.cn)("fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",a),...d,children:[r,(0,s.jsxs)(n.x8,{className:"absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground",children:[(0,s.jsx)(o.Z,{className:"h-4 w-4"}),(0,s.jsx)("span",{className:"sr-only",children:"Close"})]})]})]})});m.displayName=n.VY.displayName;let f=e=>{let{className:t,...a}=e;return(0,s.jsx)("div",{className:(0,i.cn)("flex flex-col space-y-1.5 text-center sm:text-left",t),...a})};f.displayName="DialogHeader";let p=e=>{let{className:t,...a}=e;return(0,s.jsx)("div",{className:(0,i.cn)("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",t),...a})};p.displayName="DialogFooter";let x=r.forwardRef((e,t)=>{let{className:a,...r}=e;return(0,s.jsx)(n.Dx,{ref:t,className:(0,i.cn)("text-lg font-semibold leading-none tracking-tight",a),...r})});x.displayName=n.Dx.displayName;let h=r.forwardRef((e,t)=>{let{className:a,...r}=e;return(0,s.jsx)(n.dk,{ref:t,className:(0,i.cn)("text-sm text-muted-foreground",a),...r})});h.displayName=n.dk.displayName},95186:function(e,t,a){"use strict";a.d(t,{I:function(){return o}});var s=a(57437),r=a(2265),n=a(94508);let o=r.forwardRef((e,t)=>{let{className:a,type:r,...o}=e;return(0,s.jsx)("input",{type:r,className:(0,n.cn)("flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300",a),ref:t,...o})});o.displayName="Input"},26815:function(e,t,a){"use strict";a.d(t,{_:function(){return i}});var s=a(57437),r=a(2265),n=a(6394),o=a(94508);let i=r.forwardRef((e,t)=>{let{className:a,...r}=e;return(0,s.jsx)(n.f,{ref:t,className:(0,o.cn)("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",a),...r})});i.displayName=n.f.displayName},53647:function(e,t,a){"use strict";a.d(t,{Bw:function(){return f},DI:function(){return c},Ph:function(){return l},Ql:function(){return x},i4:function(){return m},ki:function(){return u},n5:function(){return p}});var s=a(57437),r=a(2265),n=a(56873),o=a(40875),i=a(30401),d=a(94508);let l=n.fC,c=n.ZA,u=n.B4,m=r.forwardRef((e,t)=>{let{className:a,children:r,...i}=e;return(0,s.jsxs)(n.xz,{ref:t,className:(0,d.cn)("flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",a),...i,children:[r,(0,s.jsx)(n.JO,{asChild:!0,children:(0,s.jsx)(o.Z,{className:"h-4 w-4 opacity-50"})})]})});m.displayName=n.xz.displayName;let f=r.forwardRef((e,t)=>{let{className:a,children:r,position:o="popper",...i}=e;return(0,s.jsx)(n.h_,{children:(0,s.jsx)(n.VY,{ref:t,className:(0,d.cn)("relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2","popper"===o&&"data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",a),position:o,...i,children:(0,s.jsx)(n.l_,{className:(0,d.cn)("p-1","popper"===o&&"h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"),children:r})})})});f.displayName=n.VY.displayName;let p=r.forwardRef((e,t)=>{let{className:a,...r}=e;return(0,s.jsx)(n.__,{ref:t,className:(0,d.cn)("py-1.5 pl-8 pr-2 text-sm font-semibold",a),...r})});p.displayName=n.__.displayName;let x=r.forwardRef((e,t)=>{let{className:a,children:r,...o}=e;return(0,s.jsxs)(n.ck,{ref:t,className:(0,d.cn)("relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",a),...o,children:[(0,s.jsx)("span",{className:"absolute left-2 flex h-3.5 w-3.5 items-center justify-center",children:(0,s.jsx)(n.wU,{children:(0,s.jsx)(i.Z,{className:"h-4 w-4"})})}),(0,s.jsx)(n.eT,{children:r})]})});x.displayName=n.ck.displayName,r.forwardRef((e,t)=>{let{className:a,...r}=e;return(0,s.jsx)(n.Z0,{ref:t,className:(0,d.cn)("-mx-1 my-1 h-px bg-muted",a),...r})}).displayName=n.Z0.displayName},73578:function(e,t,a){"use strict";a.d(t,{RM:function(){return d},SC:function(){return l},iA:function(){return o},pj:function(){return u},ss:function(){return c},xD:function(){return i}});var s=a(57437),r=a(2265),n=a(94508);let o=r.forwardRef((e,t)=>{let{className:a,...r}=e;return(0,s.jsx)("table",{ref:t,className:(0,n.cn)("w-full caption-bottom text-sm",a),...r})});o.displayName="Table";let i=r.forwardRef((e,t)=>{let{className:a,...r}=e;return(0,s.jsx)("thead",{ref:t,className:(0,n.cn)("[&_tr]:border-b",a),...r})});i.displayName="TableHeader";let d=r.forwardRef((e,t)=>{let{className:a,...r}=e;return(0,s.jsx)("tbody",{ref:t,className:(0,n.cn)("[&_tr:last-child]:border-0",a),...r})});d.displayName="TableBody",r.forwardRef((e,t)=>{let{className:a,...r}=e;return(0,s.jsx)("tfoot",{ref:t,className:(0,n.cn)("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",a),...r})}).displayName="TableFooter";let l=r.forwardRef((e,t)=>{let{className:a,...r}=e;return(0,s.jsx)("tr",{ref:t,className:(0,n.cn)("border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",a),...r})});l.displayName="TableRow";let c=r.forwardRef((e,t)=>{let{className:a,...r}=e;return(0,s.jsx)("th",{ref:t,className:(0,n.cn)("h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",a),...r})});c.displayName="TableHead";let u=r.forwardRef((e,t)=>{let{className:a,...r}=e;return(0,s.jsx)("td",{ref:t,className:(0,n.cn)("p-4 align-middle [&:has([role=checkbox])]:pr-0",a),...r})});u.displayName="TableCell",r.forwardRef((e,t)=>{let{className:a,...r}=e;return(0,s.jsx)("caption",{ref:t,className:(0,n.cn)("mt-4 text-sm text-muted-foreground",a),...r})}).displayName="TableCaption"},12339:function(e,t,a){"use strict";a.d(t,{SP:function(){return l},dr:function(){return d},mQ:function(){return i},nU:function(){return c}});var s=a(57437),r=a(2265),n=a(20271),o=a(94508);let i=n.fC,d=r.forwardRef((e,t)=>{let{className:a,...r}=e;return(0,s.jsx)(n.aV,{ref:t,className:(0,o.cn)("inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",a),...r})});d.displayName=n.aV.displayName;let l=r.forwardRef((e,t)=>{let{className:a,...r}=e;return(0,s.jsx)(n.xz,{ref:t,className:(0,o.cn)("inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",a),...r})});l.displayName=n.xz.displayName;let c=r.forwardRef((e,t)=>{let{className:a,...r}=e;return(0,s.jsx)(n.VY,{ref:t,className:(0,o.cn)("mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",a),...r})});c.displayName=n.VY.displayName},77992:function(e,t,a){"use strict";a.d(t,{pm:function(){return m}});var s=a(2265);let r=0,n=new Map,o=e=>{if(n.has(e))return;let t=setTimeout(()=>{n.delete(e),c({type:"REMOVE_TOAST",toastId:e})},1e6);n.set(e,t)},i=(e,t)=>{switch(t.type){case"ADD_TOAST":return{...e,toasts:[t.toast,...e.toasts].slice(0,1)};case"UPDATE_TOAST":return{...e,toasts:e.toasts.map(e=>e.id===t.toast.id?{...e,...t.toast}:e)};case"DISMISS_TOAST":{let{toastId:a}=t;return a?o(a):e.toasts.forEach(e=>{o(e.id)}),{...e,toasts:e.toasts.map(e=>e.id===a||void 0===a?{...e,open:!1}:e)}}case"REMOVE_TOAST":if(void 0===t.toastId)return{...e,toasts:[]};return{...e,toasts:e.toasts.filter(e=>e.id!==t.toastId)}}},d=[],l={toasts:[]};function c(e){l=i(l,e),d.forEach(e=>{e(l)})}function u(e){let{...t}=e,a=(r=(r+1)%Number.MAX_VALUE).toString(),s=()=>c({type:"DISMISS_TOAST",toastId:a});return c({type:"ADD_TOAST",toast:{...t,id:a,open:!0,onOpenChange:e=>{e||s()}}}),{id:a,dismiss:s,update:e=>c({type:"UPDATE_TOAST",toast:{...e,id:a}})}}function m(){let[e,t]=s.useState(l);return s.useEffect(()=>(d.push(t),()=>{let e=d.indexOf(t);e>-1&&d.splice(e,1)}),[e]),{...e,toast:u,dismiss:e=>c({type:"DISMISS_TOAST",toastId:e})}}},2141:function(e,t,a){"use strict";a.d(t,{O:function(){return s}});let s=(0,a(93777).eI)("https://kronhxyuinsrsoezbtni.supabase.co","eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtyb25oeHl1aW5zcnNvZXpidG5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5NTkxMzQsImV4cCI6MjA1MTUzNTEzNH0.AFL2xKo1lasYJPwURdCKkEp_BWudW-8vDmEY6w2MY1I")},94508:function(e,t,a){"use strict";a.d(t,{S:function(){return o},cn:function(){return n}});var s=a(61994),r=a(53335);function n(){for(var e=arguments.length,t=Array(e),a=0;a<e;a++)t[a]=arguments[a];return(0,r.m6)((0,s.W)(t))}function o(){return"/edgarai"}}},function(e){e.O(0,[9903,8325,4384,6008,8001,5452,4116,2130,51,3556,9067,6605,1433,2971,2117,1744],function(){return e(e.s=7976)}),_N_E=e.O()}]);