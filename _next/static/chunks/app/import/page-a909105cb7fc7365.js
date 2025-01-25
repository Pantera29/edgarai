(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[649],{63705:function(e,t,r){Promise.resolve().then(r.bind(r,13637))},13637:function(e,t,r){"use strict";r.r(t),r.d(t,{default:function(){return c}});var n=r(57437),a=r(2265),s=r(62869),o=r(95186),l=r(26815),i=r(32759),u=r(77992);function c(){let[e,t]=(0,a.useState)(null),[r,c]=(0,a.useState)(!1),[d,f]=(0,a.useState)(0),{toast:v}=(0,u.pm)(),p=async()=>{if(!e){v({title:"No file selected",description:"Please select a file to upload.",variant:"destructive"});return}c(!0),f(0);let t=setInterval(()=>{f(e=>e>=100?(clearInterval(t),c(!1),v({title:"Upload complete",description:"Your file has been successfully uploaded and processed."}),100):e+10)},500)};return(0,n.jsxs)("div",{className:"container mx-auto py-10",children:[(0,n.jsx)("h1",{className:"text-2xl font-bold mb-4",children:"Data Import Hub"}),(0,n.jsxs)("div",{className:"grid w-full max-w-sm items-center gap-1.5",children:[(0,n.jsx)(l._,{htmlFor:"file",children:"Upload CSV or Excel file"}),(0,n.jsx)(o.I,{id:"file",type:"file",onChange:e=>{var r;t((null===(r=e.target.files)||void 0===r?void 0:r[0])||null)},accept:".csv,.xlsx,.xls"})]}),(0,n.jsx)(s.z,{className:"mt-4",onClick:p,disabled:!e||r,children:r?"Uploading...":"Upload and Process"}),r&&(0,n.jsx)(i.E,{value:d,className:"w-full max-w-sm mt-4"})]})}},62869:function(e,t,r){"use strict";r.d(t,{d:function(){return i},z:function(){return u}});var n=r(57437),a=r(2265),s=r(37053),o=r(90535),l=r(94508);let i=(0,o.j)("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",{variants:{variant:{default:"bg-primary text-primary-foreground shadow hover:bg-primary/90",destructive:"bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",outline:"border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",secondary:"bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",ghost:"hover:bg-accent hover:text-accent-foreground",link:"text-primary underline-offset-4 hover:underline"},size:{default:"h-9 px-4 py-2",sm:"h-8 rounded-md px-3 text-xs",lg:"h-10 rounded-md px-8",icon:"h-9 w-9"}},defaultVariants:{variant:"default",size:"default"}}),u=a.forwardRef((e,t)=>{let{className:r,variant:a,size:o,asChild:u=!1,...c}=e,d=u?s.g7:"button";return(0,n.jsx)(d,{className:(0,l.cn)(i({variant:a,size:o,className:r})),ref:t,...c})});u.displayName="Button"},95186:function(e,t,r){"use strict";r.d(t,{I:function(){return o}});var n=r(57437),a=r(2265),s=r(94508);let o=a.forwardRef((e,t)=>{let{className:r,type:a,...o}=e;return(0,n.jsx)("input",{type:a,className:(0,s.cn)("flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300",r),ref:t,...o})});o.displayName="Input"},26815:function(e,t,r){"use strict";r.d(t,{_:function(){return l}});var n=r(57437),a=r(2265),s=r(6394),o=r(94508);let l=a.forwardRef((e,t)=>{let{className:r,...a}=e;return(0,n.jsx)(s.f,{ref:t,className:(0,o.cn)("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",r),...a})});l.displayName=s.f.displayName},32759:function(e,t,r){"use strict";r.d(t,{E:function(){return l}});var n=r(57437),a=r(2265),s=r(60610),o=r(94508);let l=a.forwardRef((e,t)=>{let{className:r,value:a,...l}=e;return(0,n.jsx)(s.fC,{ref:t,className:(0,o.cn)("relative h-2 w-full overflow-hidden rounded-full bg-primary/20",r),...l,children:(0,n.jsx)(s.z$,{className:"h-full w-full flex-1 bg-primary transition-all",style:{transform:"translateX(-".concat(100-(a||0),"%)")}})})});l.displayName=s.fC.displayName},77992:function(e,t,r){"use strict";r.d(t,{pm:function(){return f}});var n=r(2265);let a=0,s=new Map,o=e=>{if(s.has(e))return;let t=setTimeout(()=>{s.delete(e),c({type:"REMOVE_TOAST",toastId:e})},1e6);s.set(e,t)},l=(e,t)=>{switch(t.type){case"ADD_TOAST":return{...e,toasts:[t.toast,...e.toasts].slice(0,1)};case"UPDATE_TOAST":return{...e,toasts:e.toasts.map(e=>e.id===t.toast.id?{...e,...t.toast}:e)};case"DISMISS_TOAST":{let{toastId:r}=t;return r?o(r):e.toasts.forEach(e=>{o(e.id)}),{...e,toasts:e.toasts.map(e=>e.id===r||void 0===r?{...e,open:!1}:e)}}case"REMOVE_TOAST":if(void 0===t.toastId)return{...e,toasts:[]};return{...e,toasts:e.toasts.filter(e=>e.id!==t.toastId)}}},i=[],u={toasts:[]};function c(e){u=l(u,e),i.forEach(e=>{e(u)})}function d(e){let{...t}=e,r=(a=(a+1)%Number.MAX_VALUE).toString(),n=()=>c({type:"DISMISS_TOAST",toastId:r});return c({type:"ADD_TOAST",toast:{...t,id:r,open:!0,onOpenChange:e=>{e||n()}}}),{id:r,dismiss:n,update:e=>c({type:"UPDATE_TOAST",toast:{...e,id:r}})}}function f(){let[e,t]=n.useState(u);return n.useEffect(()=>(i.push(t),()=>{let e=i.indexOf(t);e>-1&&i.splice(e,1)}),[e]),{...e,toast:d,dismiss:e=>c({type:"DISMISS_TOAST",toastId:e})}}},94508:function(e,t,r){"use strict";r.d(t,{S:function(){return o},cn:function(){return s}});var n=r(61994),a=r(53335);function s(){for(var e=arguments.length,t=Array(e),r=0;r<e;r++)t[r]=arguments[r];return(0,a.m6)((0,n.W)(t))}function o(){return"/edgarai"}},73966:function(e,t,r){"use strict";r.d(t,{b:function(){return o},k:function(){return s}});var n=r(2265),a=r(57437);function s(e,t){let r=n.createContext(t),s=e=>{let{children:t,...s}=e,o=n.useMemo(()=>s,Object.values(s));return(0,a.jsx)(r.Provider,{value:o,children:t})};return s.displayName=e+"Provider",[s,function(a){let s=n.useContext(r);if(s)return s;if(void 0!==t)return t;throw Error(`\`${a}\` must be used within \`${e}\``)}]}function o(e,t=[]){let r=[],s=()=>{let t=r.map(e=>n.createContext(e));return function(r){let a=r?.[e]||t;return n.useMemo(()=>({[`__scope${e}`]:{...r,[e]:a}}),[r,a])}};return s.scopeName=e,[function(t,s){let o=n.createContext(s),l=r.length;r=[...r,s];let i=t=>{let{scope:r,children:s,...i}=t,u=r?.[e]?.[l]||o,c=n.useMemo(()=>i,Object.values(i));return(0,a.jsx)(u.Provider,{value:c,children:s})};return i.displayName=t+"Provider",[i,function(r,a){let i=a?.[e]?.[l]||o,u=n.useContext(i);if(u)return u;if(void 0!==s)return s;throw Error(`\`${r}\` must be used within \`${t}\``)}]},function(...e){let t=e[0];if(1===e.length)return t;let r=()=>{let r=e.map(e=>({useScope:e(),scopeName:e.scopeName}));return function(e){let a=r.reduce((t,{useScope:r,scopeName:n})=>{let a=r(e)[`__scope${n}`];return{...t,...a}},{});return n.useMemo(()=>({[`__scope${t.scopeName}`]:a}),[a])}};return r.scopeName=t.scopeName,r}(s,...t)]}},6394:function(e,t,r){"use strict";r.d(t,{f:function(){return l}});var n=r(2265),a=r(66840),s=r(57437),o=n.forwardRef((e,t)=>(0,s.jsx)(a.WV.label,{...e,ref:t,onMouseDown:t=>{var r;t.target.closest("button, input, select, textarea")||(null===(r=e.onMouseDown)||void 0===r||r.call(e,t),!t.defaultPrevented&&t.detail>1&&t.preventDefault())}}));o.displayName="Label";var l=o},60610:function(e,t,r){"use strict";r.d(t,{fC:function(){return y},z$:function(){return N}});var n=r(2265),a=r(73966),s=r(66840),o=r(57437),l="Progress",[i,u]=(0,a.b)(l),[c,d]=i(l),f=n.forwardRef((e,t)=>{var r,n,a,l;let{__scopeProgress:i,value:u=null,max:d,getValueLabel:f=m,...v}=e;(d||0===d)&&!h(d)&&console.error((r="".concat(d),n="Progress","Invalid prop `max` of value `".concat(r,"` supplied to `").concat(n,"`. Only numbers greater than 0 are valid max values. Defaulting to `").concat(100,"`.")));let p=h(d)?d:100;null===u||g(u,p)||console.error((a="".concat(u),l="Progress","Invalid prop `value` of value `".concat(a,"` supplied to `").concat(l,"`. The `value` prop must be:\n  - a positive number\n  - less than the value passed to `max` (or ").concat(100," if no `max` prop is set)\n  - `null` or `undefined` if the progress is indeterminate.\n\nDefaulting to `null`.")));let y=g(u,p)?u:null,N=b(y)?f(y,p):void 0;return(0,o.jsx)(c,{scope:i,value:y,max:p,children:(0,o.jsx)(s.WV.div,{"aria-valuemax":p,"aria-valuemin":0,"aria-valuenow":b(y)?y:void 0,"aria-valuetext":N,role:"progressbar","data-state":x(y,p),"data-value":null!=y?y:void 0,"data-max":p,...v,ref:t})})});f.displayName=l;var v="ProgressIndicator",p=n.forwardRef((e,t)=>{var r;let{__scopeProgress:n,...a}=e,l=d(v,n);return(0,o.jsx)(s.WV.div,{"data-state":x(l.value,l.max),"data-value":null!==(r=l.value)&&void 0!==r?r:void 0,"data-max":l.max,...a,ref:t})});function m(e,t){return"".concat(Math.round(e/t*100),"%")}function x(e,t){return null==e?"indeterminate":e===t?"complete":"loading"}function b(e){return"number"==typeof e}function h(e){return b(e)&&!isNaN(e)&&e>0}function g(e,t){return b(e)&&!isNaN(e)&&e<=t&&e>=0}p.displayName=v;var y=f,N=p},90535:function(e,t,r){"use strict";r.d(t,{j:function(){return o}});var n=r(61994);let a=e=>"boolean"==typeof e?`${e}`:0===e?"0":e,s=n.W,o=(e,t)=>r=>{var n;if((null==t?void 0:t.variants)==null)return s(e,null==r?void 0:r.class,null==r?void 0:r.className);let{variants:o,defaultVariants:l}=t,i=Object.keys(o).map(e=>{let t=null==r?void 0:r[e],n=null==l?void 0:l[e];if(null===t)return null;let s=a(t)||a(n);return o[e][s]}),u=r&&Object.entries(r).reduce((e,t)=>{let[r,n]=t;return void 0===n||(e[r]=n),e},{});return s(e,i,null==t?void 0:null===(n=t.compoundVariants)||void 0===n?void 0:n.reduce((e,t)=>{let{class:r,className:n,...a}=t;return Object.entries(a).every(e=>{let[t,r]=e;return Array.isArray(r)?r.includes({...l,...u}[t]):({...l,...u})[t]===r})?[...e,r,n]:e},[]),null==r?void 0:r.class,null==r?void 0:r.className)}}},function(e){e.O(0,[9903,2971,2117,1744],function(){return e(e.s=63705)}),_N_E=e.O()}]);