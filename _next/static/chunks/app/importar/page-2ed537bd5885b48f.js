(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[1256],{50569:function(e,t,r){Promise.resolve().then(r.bind(r,76482))},76482:function(e,t,r){"use strict";r.r(t),r.d(t,{default:function(){return c}});var n=r(57437),a=r(2265),o=r(62869),s=r(95186),i=r(26815),l=r(72785),u=r(77992);function c(){let[e,t]=(0,a.useState)(null),[r,c]=(0,a.useState)(!1),[d,f]=(0,a.useState)(0),{toast:v}=(0,u.pm)(),m=async()=>{if(!e){v({title:"No se ha seleccionado ning\xfan archivo",description:"Por favor, seleccione un archivo para subir.",variant:"destructive"});return}c(!0),f(0);let t=setInterval(()=>{f(e=>e>=100?(clearInterval(t),c(!1),v({title:"Subida completada",description:"Su archivo ha sido subido y procesado con \xe9xito."}),100):e+10)},500)};return(0,n.jsxs)("div",{className:"container mx-auto py-10",children:[(0,n.jsx)("h1",{className:"text-2xl font-bold mb-4",children:"Centro de Importaci\xf3n de Datos"}),(0,n.jsxs)("div",{className:"grid w-full max-w-sm items-center gap-1.5",children:[(0,n.jsx)(i._,{htmlFor:"archivo",children:"Subir archivo CSV o Excel"}),(0,n.jsx)(s.I,{id:"archivo",type:"file",onChange:e=>{var r;t((null===(r=e.target.files)||void 0===r?void 0:r[0])||null)},accept:".csv,.xlsx,.xls"})]}),(0,n.jsx)(o.z,{className:"mt-4",onClick:m,disabled:!e||r,children:r?"Subiendo...":"Subir y Procesar"}),r&&(0,n.jsx)(l.E,{value:d,className:"w-full max-w-sm mt-4"})]})}},62869:function(e,t,r){"use strict";r.d(t,{z:function(){return u}});var n=r(57437),a=r(2265),o=r(37053),s=r(90535),i=r(94508);let l=(0,s.j)("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",{variants:{variant:{default:"bg-primary text-primary-foreground shadow hover:bg-primary/90",destructive:"bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",outline:"border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",secondary:"bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",ghost:"hover:bg-accent hover:text-accent-foreground",link:"text-primary underline-offset-4 hover:underline"},size:{default:"h-9 px-4 py-2",sm:"h-8 rounded-md px-3 text-xs",lg:"h-10 rounded-md px-8",icon:"h-9 w-9"}},defaultVariants:{variant:"default",size:"default"}}),u=a.forwardRef((e,t)=>{let{className:r,variant:a,size:s,asChild:u=!1,...c}=e,d=u?o.g7:"button";return(0,n.jsx)(d,{className:(0,i.cn)(l({variant:a,size:s,className:r})),ref:t,...c})});u.displayName="Button"},95186:function(e,t,r){"use strict";r.d(t,{I:function(){return s}});var n=r(57437),a=r(2265),o=r(94508);let s=a.forwardRef((e,t)=>{let{className:r,type:a,...s}=e;return(0,n.jsx)("input",{type:a,className:(0,o.cn)("flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300",r),ref:t,...s})});s.displayName="Input"},26815:function(e,t,r){"use strict";r.d(t,{_:function(){return i}});var n=r(57437),a=r(2265),o=r(6394),s=r(94508);let i=a.forwardRef((e,t)=>{let{className:r,...a}=e;return(0,n.jsx)(o.f,{ref:t,className:(0,s.cn)("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",r),...a})});i.displayName=o.f.displayName},72785:function(e,t,r){"use strict";r.d(t,{E:function(){return N}});var n=r(57437),a=r(2265),o=r(73966),s=r(66840),i="Progress",[l,u]=(0,o.b)(i),[c,d]=l(i),f=a.forwardRef((e,t)=>{var r,a,o,i;let{__scopeProgress:l,value:u=null,max:d,getValueLabel:f=p,...v}=e;(d||0===d)&&!b(d)&&console.error((r="".concat(d),a="Progress","Invalid prop `max` of value `".concat(r,"` supplied to `").concat(a,"`. Only numbers greater than 0 are valid max values. Defaulting to `").concat(100,"`.")));let m=b(d)?d:100;null===u||g(u,m)||console.error((o="".concat(u),i="Progress","Invalid prop `value` of value `".concat(o,"` supplied to `").concat(i,"`. The `value` prop must be:\n  - a positive number\n  - less than the value passed to `max` (or ").concat(100," if no `max` prop is set)\n  - `null` or `undefined` if the progress is indeterminate.\n\nDefaulting to `null`.")));let y=g(u,m)?u:null,N=x(y)?f(y,m):void 0;return(0,n.jsx)(c,{scope:l,value:y,max:m,children:(0,n.jsx)(s.WV.div,{"aria-valuemax":m,"aria-valuemin":0,"aria-valuenow":x(y)?y:void 0,"aria-valuetext":N,role:"progressbar","data-state":h(y,m),"data-value":null!=y?y:void 0,"data-max":m,...v,ref:t})})});f.displayName=i;var v="ProgressIndicator",m=a.forwardRef((e,t)=>{var r;let{__scopeProgress:a,...o}=e,i=d(v,a);return(0,n.jsx)(s.WV.div,{"data-state":h(i.value,i.max),"data-value":null!==(r=i.value)&&void 0!==r?r:void 0,"data-max":i.max,...o,ref:t})});function p(e,t){return"".concat(Math.round(e/t*100),"%")}function h(e,t){return null==e?"indeterminate":e===t?"complete":"loading"}function x(e){return"number"==typeof e}function b(e){return x(e)&&!isNaN(e)&&e>0}function g(e,t){return x(e)&&!isNaN(e)&&e<=t&&e>=0}m.displayName=v;var y=r(94508);let N=a.forwardRef((e,t)=>{let{className:r,value:a,...o}=e;return(0,n.jsx)(f,{ref:t,className:(0,y.cn)("relative h-2 w-full overflow-hidden rounded-full bg-primary/20",r),...o,children:(0,n.jsx)(m,{className:"h-full w-full flex-1 bg-primary transition-all",style:{transform:"translateX(-".concat(100-(a||0),"%)")}})})});N.displayName=f.displayName},77992:function(e,t,r){"use strict";r.d(t,{pm:function(){return f}});var n=r(2265);let a=0,o=new Map,s=e=>{if(o.has(e))return;let t=setTimeout(()=>{o.delete(e),c({type:"REMOVE_TOAST",toastId:e})},1e6);o.set(e,t)},i=(e,t)=>{switch(t.type){case"ADD_TOAST":return{...e,toasts:[t.toast,...e.toasts].slice(0,1)};case"UPDATE_TOAST":return{...e,toasts:e.toasts.map(e=>e.id===t.toast.id?{...e,...t.toast}:e)};case"DISMISS_TOAST":{let{toastId:r}=t;return r?s(r):e.toasts.forEach(e=>{s(e.id)}),{...e,toasts:e.toasts.map(e=>e.id===r||void 0===r?{...e,open:!1}:e)}}case"REMOVE_TOAST":if(void 0===t.toastId)return{...e,toasts:[]};return{...e,toasts:e.toasts.filter(e=>e.id!==t.toastId)}}},l=[],u={toasts:[]};function c(e){u=i(u,e),l.forEach(e=>{e(u)})}function d(e){let{...t}=e,r=(a=(a+1)%Number.MAX_VALUE).toString(),n=()=>c({type:"DISMISS_TOAST",toastId:r});return c({type:"ADD_TOAST",toast:{...t,id:r,open:!0,onOpenChange:e=>{e||n()}}}),{id:r,dismiss:n,update:e=>c({type:"UPDATE_TOAST",toast:{...e,id:r}})}}function f(){let[e,t]=n.useState(u);return n.useEffect(()=>(l.push(t),()=>{let e=l.indexOf(t);e>-1&&l.splice(e,1)}),[e]),{...e,toast:d,dismiss:e=>c({type:"DISMISS_TOAST",toastId:e})}}},94508:function(e,t,r){"use strict";r.d(t,{S:function(){return s},cn:function(){return o}});var n=r(61994),a=r(53335);function o(){for(var e=arguments.length,t=Array(e),r=0;r<e;r++)t[r]=arguments[r];return(0,a.m6)((0,n.W)(t))}function s(){return"/edgarai"}},73966:function(e,t,r){"use strict";r.d(t,{b:function(){return s},k:function(){return o}});var n=r(2265),a=r(57437);function o(e,t){let r=n.createContext(t),o=e=>{let{children:t,...o}=e,s=n.useMemo(()=>o,Object.values(o));return(0,a.jsx)(r.Provider,{value:s,children:t})};return o.displayName=e+"Provider",[o,function(a){let o=n.useContext(r);if(o)return o;if(void 0!==t)return t;throw Error(`\`${a}\` must be used within \`${e}\``)}]}function s(e,t=[]){let r=[],o=()=>{let t=r.map(e=>n.createContext(e));return function(r){let a=r?.[e]||t;return n.useMemo(()=>({[`__scope${e}`]:{...r,[e]:a}}),[r,a])}};return o.scopeName=e,[function(t,o){let s=n.createContext(o),i=r.length;r=[...r,o];let l=t=>{let{scope:r,children:o,...l}=t,u=r?.[e]?.[i]||s,c=n.useMemo(()=>l,Object.values(l));return(0,a.jsx)(u.Provider,{value:c,children:o})};return l.displayName=t+"Provider",[l,function(r,a){let l=a?.[e]?.[i]||s,u=n.useContext(l);if(u)return u;if(void 0!==o)return o;throw Error(`\`${r}\` must be used within \`${t}\``)}]},function(...e){let t=e[0];if(1===e.length)return t;let r=()=>{let r=e.map(e=>({useScope:e(),scopeName:e.scopeName}));return function(e){let a=r.reduce((t,{useScope:r,scopeName:n})=>{let a=r(e)[`__scope${n}`];return{...t,...a}},{});return n.useMemo(()=>({[`__scope${t.scopeName}`]:a}),[a])}};return r.scopeName=t.scopeName,r}(o,...t)]}},6394:function(e,t,r){"use strict";r.d(t,{f:function(){return i}});var n=r(2265),a=r(66840),o=r(57437),s=n.forwardRef((e,t)=>(0,o.jsx)(a.WV.label,{...e,ref:t,onMouseDown:t=>{var r;t.target.closest("button, input, select, textarea")||(null===(r=e.onMouseDown)||void 0===r||r.call(e,t),!t.defaultPrevented&&t.detail>1&&t.preventDefault())}}));s.displayName="Label";var i=s},90535:function(e,t,r){"use strict";r.d(t,{j:function(){return s}});var n=r(61994);let a=e=>"boolean"==typeof e?`${e}`:0===e?"0":e,o=n.W,s=(e,t)=>r=>{var n;if((null==t?void 0:t.variants)==null)return o(e,null==r?void 0:r.class,null==r?void 0:r.className);let{variants:s,defaultVariants:i}=t,l=Object.keys(s).map(e=>{let t=null==r?void 0:r[e],n=null==i?void 0:i[e];if(null===t)return null;let o=a(t)||a(n);return s[e][o]}),u=r&&Object.entries(r).reduce((e,t)=>{let[r,n]=t;return void 0===n||(e[r]=n),e},{});return o(e,l,null==t?void 0:null===(n=t.compoundVariants)||void 0===n?void 0:n.reduce((e,t)=>{let{class:r,className:n,...a}=t;return Object.entries(a).every(e=>{let[t,r]=e;return Array.isArray(r)?r.includes({...i,...u}[t]):({...i,...u})[t]===r})?[...e,r,n]:e},[]),null==r?void 0:r.class,null==r?void 0:r.className)}}},function(e){e.O(0,[9903,2971,2117,1744],function(){return e(e.s=50569)}),_N_E=e.O()}]);