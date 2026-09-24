import{r as e}from"./rolldown-runtime-hePW80VL.js";import{c as t}from"./forms-B5zJtJXX.js";import{i as n,r}from"./react-vendor-DL_CRepa.js";import{E as i,P as a,St as o,gt as s,n as c,qt as l,yt as u}from"./icons-CXY2ew6m.js";import{t as d}from"./button-BljpdZkr.js";import{t as f}from"./cn-DzAH-Pyn.js";import{$ as p,J as m,X as h,at as g,u as _}from"./index-m5Q30JYn.js";import{n as v,t as y}from"./format-BL1a4wwr.js";import{r as b}from"./bulk-export-BXaPZbQn.js";var x=e(t(),1),S=n();function C({invoice:e,settings:t,className:n,preview:r=!0}){return(0,S.jsx)(`article`,{className:f(`bg-white text-slate-900 shadow-sm [color-scheme:light]`,r&&`mx-auto w-full max-w-[210mm] origin-top scale-[0.92] rounded-sm border border-slate-200 sm:scale-100`,n),"data-invoice-preview":!0,children:(0,S.jsxs)(`div`,{className:`min-h-[297mm] p-8 sm:p-10`,children:[(0,S.jsxs)(`header`,{className:`flex flex-col justify-between gap-6 border-b-2 border-slate-900 pb-5 sm:flex-row`,children:[(0,S.jsxs)(`div`,{className:`min-w-0`,children:[(0,S.jsx)(`h1`,{className:`font-display text-xl font-semibold tracking-tight sm:text-2xl`,children:t.businessName}),(0,S.jsx)(`p`,{className:`mt-1 max-w-sm text-xs text-slate-500`,children:t.address}),(0,S.jsxs)(`p`,{className:`text-xs text-slate-500`,children:[`Phone `,t.phone,` · `,t.email]}),(0,S.jsxs)(`p`,{className:`text-xs text-slate-500`,children:[`GSTIN `,t.gstNumber,` · PAN `,t.pan]})]}),(0,S.jsxs)(`div`,{className:`shrink-0 text-left sm:text-right`,children:[(0,S.jsx)(`p`,{className:`text-[11px] font-bold tracking-[0.12em] text-slate-800`,children:`TAX INVOICE`}),(0,S.jsx)(`p`,{className:`mt-1 text-base font-semibold`,children:e.invoiceNo}),(0,S.jsx)(`p`,{className:`text-xs text-slate-500`,children:v(e.date,`long`)}),(0,S.jsx)(`p`,{className:`mt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600`,children:e.status})]})]}),(0,S.jsxs)(`section`,{className:`mt-5`,children:[(0,S.jsx)(`p`,{className:`text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500`,children:`Bill to`}),(0,S.jsx)(`p`,{className:`mt-1 text-sm font-semibold`,children:e.customerName}),(0,S.jsx)(`p`,{className:`text-xs text-slate-500`,children:e.customerAddress||`—`}),e.customerGst?(0,S.jsxs)(`p`,{className:`text-xs text-slate-500`,children:[`GSTIN `,e.customerGst]}):null]}),(0,S.jsx)(`div`,{className:`mt-6 overflow-x-auto`,children:(0,S.jsxs)(`table`,{className:`w-full border-collapse text-xs`,children:[(0,S.jsx)(`thead`,{children:(0,S.jsxs)(`tr`,{className:`border-b border-slate-200 text-left text-[10px] uppercase tracking-wide text-slate-500`,children:[(0,S.jsx)(`th`,{className:`py-2 pr-2 font-semibold`,children:`Item`}),(0,S.jsx)(`th`,{className:`py-2 px-2 text-center font-semibold`,children:`Qty`}),(0,S.jsx)(`th`,{className:`py-2 px-2 text-right font-semibold`,children:`Rate`}),(0,S.jsx)(`th`,{className:`py-2 px-2 text-right font-semibold`,children:`Disc.`}),(0,S.jsx)(`th`,{className:`py-2 px-2 text-right font-semibold`,children:`GST`}),(0,S.jsx)(`th`,{className:`py-2 pl-2 text-right font-semibold`,children:`Amount`})]})}),(0,S.jsx)(`tbody`,{children:e.items.map(e=>(0,S.jsxs)(`tr`,{className:`border-b border-slate-100`,children:[(0,S.jsxs)(`td`,{className:`py-2.5 pr-2 align-top`,children:[(0,S.jsx)(`span`,{className:`font-medium text-slate-900`,children:e.productName}),(0,S.jsx)(`br`,{}),(0,S.jsx)(`span`,{className:`text-[11px] text-slate-500`,children:e.sku})]}),(0,S.jsx)(`td`,{className:`px-2 py-2.5 text-center align-top`,children:e.quantity}),(0,S.jsx)(`td`,{className:`px-2 py-2.5 text-right align-top`,children:y(e.rate)}),(0,S.jsx)(`td`,{className:`px-2 py-2.5 text-right align-top`,children:e.discount?`${e.discount}%`:`—`}),(0,S.jsxs)(`td`,{className:`px-2 py-2.5 text-right align-top`,children:[e.gstRate,`%`]}),(0,S.jsx)(`td`,{className:`py-2.5 pl-2 text-right align-top font-medium`,children:y(e.amount)})]},e.id))})]})}),(0,S.jsxs)(`section`,{className:`ml-auto mt-6 w-full max-w-[260px] space-y-1 text-xs`,children:[(0,S.jsxs)(`div`,{className:`flex justify-between gap-4`,children:[(0,S.jsx)(`span`,{className:`text-slate-500`,children:`Subtotal`}),(0,S.jsx)(`span`,{children:y(e.subtotal)})]}),e.discount?(0,S.jsxs)(`div`,{className:`flex justify-between gap-4`,children:[(0,S.jsx)(`span`,{className:`text-slate-500`,children:`Discount`}),(0,S.jsx)(`span`,{children:y(e.discount)})]}):null,(0,S.jsxs)(`div`,{className:`flex justify-between gap-4`,children:[(0,S.jsx)(`span`,{className:`text-slate-500`,children:`CGST`}),(0,S.jsx)(`span`,{children:y(e.cgst)})]}),(0,S.jsxs)(`div`,{className:`flex justify-between gap-4`,children:[(0,S.jsx)(`span`,{className:`text-slate-500`,children:`SGST`}),(0,S.jsx)(`span`,{children:y(e.sgst)})]}),e.igst?(0,S.jsxs)(`div`,{className:`flex justify-between gap-4`,children:[(0,S.jsx)(`span`,{className:`text-slate-500`,children:`IGST`}),(0,S.jsx)(`span`,{children:y(e.igst)})]}):null,e.otherCharges?(0,S.jsxs)(`div`,{className:`flex justify-between gap-4`,children:[(0,S.jsx)(`span`,{className:`text-slate-500`,children:`Other charges`}),(0,S.jsx)(`span`,{children:y(e.otherCharges)})]}):null,e.roundOff?(0,S.jsxs)(`div`,{className:`flex justify-between gap-4`,children:[(0,S.jsx)(`span`,{className:`text-slate-500`,children:`Round off`}),(0,S.jsx)(`span`,{children:y(e.roundOff)})]}):null,(0,S.jsxs)(`div`,{className:`flex justify-between gap-4 border-t border-slate-900 pt-2 text-sm font-semibold`,children:[(0,S.jsx)(`span`,{children:`Grand total`}),(0,S.jsx)(`span`,{children:y(e.grandTotal)})]}),(0,S.jsxs)(`div`,{className:`flex justify-between gap-4 text-slate-500`,children:[(0,S.jsx)(`span`,{children:`Paid`}),(0,S.jsx)(`span`,{children:y(e.paid)})]}),(0,S.jsxs)(`div`,{className:`flex justify-between gap-4 font-medium`,children:[(0,S.jsx)(`span`,{children:`Balance due`}),(0,S.jsx)(`span`,{children:y(e.balance)})]})]}),(0,S.jsxs)(`footer`,{className:`mt-10 border-t border-slate-200 pt-3 text-[11px] text-slate-500`,children:[(0,S.jsx)(`p`,{children:`Thank you for your business.`}),(0,S.jsxs)(`p`,{children:[`This is a computer-generated invoice from `,t.businessName,`.`]})]})]})})}var w=e(r(),1);function T({open:e,onClose:t,title:n,description:r,children:i,side:a=`right`,className:o,widthClassName:s=`w-full max-w-md`}){let l=(0,x.useId)(),u=(0,x.useId)(),p=(0,x.useRef)(null),m=(0,x.useCallback)(e=>{e.key===`Escape`&&(e.stopPropagation(),t())},[t]);return(0,x.useEffect)(()=>{if(!e)return;document.addEventListener(`keydown`,m);let t=document.body.style.overflow;return document.body.style.overflow=`hidden`,()=>{document.removeEventListener(`keydown`,m),document.body.style.overflow=t}},[e,m]),h(e,p),e?(0,w.createPortal)((0,S.jsxs)(`div`,{className:`fixed inset-0 z-50 flex`,children:[(0,S.jsx)(`div`,{className:`erp-overlay erp-anim-overlay absolute inset-0`,"aria-hidden":!0,onClick:t}),(0,S.jsxs)(`div`,{ref:p,role:`dialog`,"aria-modal":`true`,"aria-labelledby":n?l:void 0,"aria-describedby":r?u:void 0,tabIndex:-1,className:f(`relative z-10 flex h-full flex-col border-border bg-surface-elevated shadow-elevated outline-none`,a===`right`&&`erp-anim-drawer-right ml-auto border-l`,a===`left`&&`erp-anim-drawer-left mr-auto border-r`,s,o),children:[(0,S.jsxs)(`div`,{className:`flex shrink-0 items-start justify-between gap-3 border-b border-border px-4 py-3`,children:[(0,S.jsxs)(`div`,{className:`min-w-0`,children:[n?(0,S.jsx)(`h2`,{id:l,className:`font-display text-lg font-semibold text-ink`,children:n}):null,r?(0,S.jsx)(`p`,{id:u,className:`mt-0.5 text-sm text-ink-muted`,children:r}):null]}),(0,S.jsx)(d,{type:`button`,variant:`ghost`,size:`sm`,className:`h-8 w-8 shrink-0 p-0`,onClick:t,"aria-label":`Close panel`,children:(0,S.jsx)(c,{className:`h-4 w-4`,"aria-hidden":!0})})]}),(0,S.jsx)(`div`,{className:`min-h-0 flex-1 overflow-y-auto px-4 py-3 scrollbar-thin`,children:i})]})]}),document.body):null}function E(e){return e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`)}function D(e){try{return new Intl.DateTimeFormat(`en-IN`,{day:`2-digit`,month:`long`,year:`numeric`}).format(new Date(e))}catch{return e}}function O(e,t){let n=e.items.map(e=>`
      <tr>
        <td>
          <strong>${E(e.productName)}</strong>
          <div class="muted">${E(e.sku)}</div>
        </td>
        <td class="center">${e.quantity}</td>
        <td class="right">${b(e.rate)}</td>
        <td class="right">${e.discount?`${e.discount}%`:`—`}</td>
        <td class="right">${e.gstRate}%</td>
        <td class="right">${b(e.amount)}</td>
      </tr>`).join(``);return`
  <article class="invoice-a4">
    <header class="inv-head">
      <div>
        <h1>${E(t.businessName)}</h1>
        <p class="muted">${E(t.address)}</p>
        <p class="muted">Phone ${E(t.phone)} · ${E(t.email)}</p>
        <p class="muted">GSTIN ${E(t.gstNumber)} · PAN ${E(t.pan)}</p>
      </div>
      <div class="inv-meta">
        <p class="badge">TAX INVOICE</p>
        <p><strong>${E(e.invoiceNo)}</strong></p>
        <p class="muted">${D(e.date)}</p>
        <p class="status">${E(e.status.toUpperCase())}</p>
      </div>
    </header>

    <section class="bill-to">
      <p class="label">Bill to</p>
      <p class="party">${E(e.customerName)}</p>
      <p class="muted">${E(e.customerAddress||`—`)}</p>
      ${e.customerGst?`<p class="muted">GSTIN ${E(e.customerGst)}</p>`:``}
    </section>

    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th class="center">Qty</th>
          <th class="right">Rate</th>
          <th class="right">Disc.</th>
          <th class="right">GST</th>
          <th class="right">Amount</th>
        </tr>
      </thead>
      <tbody>${n}</tbody>
    </table>

    <section class="totals">
      <div><span>Subtotal</span><span>${b(e.subtotal)}</span></div>
      ${e.discount?`<div><span>Discount</span><span>${b(e.discount)}</span></div>`:``}
      <div><span>CGST</span><span>${b(e.cgst)}</span></div>
      <div><span>SGST</span><span>${b(e.sgst)}</span></div>
      ${e.igst?`<div><span>IGST</span><span>${b(e.igst)}</span></div>`:``}
      ${e.otherCharges?`<div><span>Other charges</span><span>${b(e.otherCharges)}</span></div>`:``}
      ${e.roundOff?`<div><span>Round off</span><span>${b(e.roundOff)}</span></div>`:``}
      <div class="grand"><span>Grand total</span><span>${b(e.grandTotal)}</span></div>
      <div><span>Paid</span><span>${b(e.paid)}</span></div>
      <div><span>Balance due</span><span>${b(e.balance)}</span></div>
    </section>

    <footer class="inv-foot">
      <p class="muted">Thank you for your business.</p>
      <p class="muted">This is a computer-generated invoice from ${E(t.businessName)}.</p>
    </footer>
  </article>`}var k=`
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 0;
    font-family: "Segoe UI", system-ui, sans-serif;
    color: #0f172a;
    background: #fff;
  }
  .invoice-a4 {
    width: 210mm;
    min-height: 297mm;
    margin: 0 auto;
    padding: 12mm;
    background: #fff;
  }
  .inv-head { display: flex; justify-content: space-between; gap: 24px; border-bottom: 2px solid #0f172a; padding-bottom: 16px; }
  .inv-head h1 { margin: 0 0 6px; font-size: 22px; letter-spacing: -0.02em; }
  .muted { color: #64748b; font-size: 12px; margin: 2px 0; }
  .inv-meta { text-align: right; }
  .badge { display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; margin: 0 0 6px; }
  .status { font-size: 11px; font-weight: 600; text-transform: uppercase; margin-top: 6px; }
  .bill-to { margin: 18px 0; }
  .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; margin: 0 0 4px; }
  .party { font-size: 15px; font-weight: 600; margin: 0 0 2px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
  th, td { border-bottom: 1px solid #e2e8f0; padding: 8px 6px; vertical-align: top; }
  th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b; }
  .center { text-align: center; }
  .right { text-align: right; }
  .totals { margin-left: auto; margin-top: 16px; width: 260px; font-size: 12px; }
  .totals div { display: flex; justify-content: space-between; gap: 16px; padding: 3px 0; }
  .totals .grand { font-size: 14px; font-weight: 700; border-top: 1px solid #0f172a; margin-top: 6px; padding-top: 8px; }
  .inv-foot { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 12px; }
`;function A(e,t){let n=window.open(``,`_blank`,`noopener,noreferrer,width=900,height=1100`);if(!n)return!1;let r=`Invoice ${e.invoiceNo}`;return n.document.write(`<!DOCTYPE html><html><head><title>${r}</title>
    <style>${k}</style>
  </head><body>${O(e,t)}</body></html>`),n.document.close(),n.focus(),n.print(),!0}function j(e,t){let n=`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Invoice ${e.invoiceNo}</title>
    <style>${k}</style>
  </head><body>${O(e,t)}</body></html>`,r=new Blob([n],{type:`text/html;charset=utf-8`}),i=URL.createObjectURL(r),a=document.createElement(`a`);a.href=i,a.download=`${e.invoiceNo.replace(/[^\w.-]+/g,`_`)}.html`,a.click(),URL.revokeObjectURL(i)}async function M(e,t,n){let r=`${t.businessName} — Invoice ${e.invoiceNo}\nAmount: ${b(e.grandTotal)}\nBalance: ${b(e.balance)}\n${n}`;try{if(navigator.share){let i=`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Invoice ${e.invoiceNo}</title>
        <style>${k}</style>
      </head><body>${O(e,t)}</body></html>`,a=new File([i],`${e.invoiceNo.replace(/[^\w.-]+/g,`_`)}.html`,{type:`text/html`});return!navigator.canShare||navigator.canShare({files:[a]})?(await navigator.share({title:`Invoice ${e.invoiceNo}`,text:r,files:[a]}),`shared`):(await navigator.share({title:`Invoice ${e.invoiceNo}`,text:r,url:n}),`shared`)}}catch(e){if(e instanceof DOMException&&e.name===`AbortError`)return`failed`}try{return await navigator.clipboard.writeText(r),`copied`}catch{return`failed`}}function N({open:e,invoice:t,onClose:n,onCancelled:r}){let c=_(e=>e.settings),f=_(e=>e.cancelSale),{toast:h}=p(),v=g(),[y,b]=(0,x.useState)(!1);if(!t)return(0,S.jsx)(T,{open:e,onClose:n,title:`Invoice preview`,widthClassName:`w-full max-w-3xl`,children:(0,S.jsx)(`p`,{className:`text-sm text-ink-muted`,children:`No invoice selected.`})});let w=t.status===`cancelled`,E=typeof window<`u`?`${window.location.origin}/transactions/invoices/${t.id}`:`/transactions/invoices/${t.id}`;return(0,S.jsxs)(S.Fragment,{children:[(0,S.jsx)(T,{open:e,onClose:n,title:`Invoice ${t.invoiceNo}`,description:`A4 preview — print or download before sharing with the customer.`,widthClassName:`w-full max-w-4xl`,children:(0,S.jsxs)(`div`,{className:`space-y-3`,children:[(0,S.jsxs)(`div`,{className:`sticky top-0 z-10 -mx-1 flex flex-wrap gap-2 border-b border-border bg-surface-elevated px-1 pb-3`,children:[(0,S.jsxs)(d,{type:`button`,size:`sm`,className:`gap-1.5`,onClick:()=>{A(t,c)?h({title:`Print dialog opened`,variant:`success`}):h({title:`Allow pop-ups to print`,variant:`error`})},children:[(0,S.jsx)(a,{className:`h-4 w-4`}),`Print`]}),(0,S.jsxs)(d,{type:`button`,size:`sm`,variant:`outline`,className:`gap-1.5`,onClick:()=>{j(t,c),h({title:`Invoice downloaded`,description:`Open the HTML file and Print → Save as PDF for A4.`,variant:`success`})},children:[(0,S.jsx)(u,{className:`h-4 w-4`}),`Download`]}),(0,S.jsxs)(d,{type:`button`,size:`sm`,variant:`outline`,className:`gap-1.5`,onClick:async()=>{let e=await M(t,c,E);h(e===`shared`?{title:`Invoice shared`,variant:`success`}:e===`copied`?{title:`Invoice details copied`,description:`Share link and totals are on the clipboard.`,variant:`success`}:{title:`Unable to share`,variant:`error`})},children:[(0,S.jsx)(i,{className:`h-4 w-4`}),`Share`]}),(0,S.jsxs)(d,{type:`button`,size:`sm`,variant:`outline`,className:`gap-1.5`,onClick:()=>{let e=_.getState().sales.find(e=>e.id===t.saleId);v(`/transactions/sales/new`,{state:{customerId:t.customerId,duplicateFromInvoiceId:t.id,notes:e?.notes?`Duplicated from ${t.invoiceNo}. ${e.notes}`:`Duplicated from ${t.invoiceNo}`,items:t.items.map(e=>({productId:e.productId,productName:e.productName,sku:e.sku,quantity:e.quantity,rate:e.rate,discount:e.discount,gstRate:e.gstRate,notes:e.notes}))}}),n(),h({title:`Duplicating invoice`,description:`Review the new sale draft, then confirm.`,variant:`success`})},children:[(0,S.jsx)(o,{className:`h-4 w-4`}),`Duplicate`]}),(0,S.jsxs)(d,{type:`button`,size:`sm`,variant:`danger`,className:`gap-1.5`,disabled:w,onClick:()=>b(!0),children:[(0,S.jsx)(l,{className:`h-4 w-4`}),`Cancel`]}),(0,S.jsxs)(d,{type:`button`,size:`sm`,variant:`ghost`,className:`ml-auto gap-1.5`,onClick:()=>{n(),v(`/transactions/invoices/${t.id}`)},children:[(0,S.jsx)(s,{className:`h-4 w-4`}),`Full page`]})]}),(0,S.jsxs)(`div`,{className:`invoice-stage p-3 sm:p-5`,children:[(0,S.jsx)(`p`,{className:`mb-3 text-center text-[11px] font-medium uppercase tracking-wider text-ink-muted`,children:`A4 preview`}),(0,S.jsx)(C,{invoice:t,settings:c})]})]})}),(0,S.jsx)(m,{open:y,onClose:()=>b(!1),onConfirm:()=>{let e=f(t.saleId);if(!e.ok){h({title:`Cannot cancel`,description:e.message,variant:`error`});return}h({title:`Invoice cancelled`,variant:`success`}),b(!1),r?.(t.id),n()},title:`Cancel this invoice?`,description:`Invoice ${t.invoiceNo} and its linked sale will be cancelled. Stock and party balances will be reversed where applicable.`,confirmLabel:`Cancel invoice`,variant:`danger`})]})}export{A as a,j as i,k as n,M as o,O as r,C as s,N as t};