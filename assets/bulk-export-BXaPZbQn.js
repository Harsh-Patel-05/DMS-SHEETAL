function e(e){return/[",\n\r]/.test(e)?`"${e.replace(/"/g,`""`)}"`:e}function t(t,n,r){let i=[n.map(e).join(`,`),...r.map(t=>t.map(t=>e(t)).join(`,`))],a=new Blob([i.join(`
`)],{type:`text/csv;charset=utf-8;`}),o=URL.createObjectURL(a),s=document.createElement(`a`);s.href=o,s.download=t.endsWith(`.csv`)?t:`${t}.csv`,s.click(),URL.revokeObjectURL(o)}function n(e,t){let n=window.open(``,`_blank`,`noopener,noreferrer,width=960,height=720`);return n?(n.document.write(`<!DOCTYPE html><html><head><title>${e}</title>
    <style>
      body { font-family: system-ui, sans-serif; padding: 20px; color: #0f172a; }
      h1 { font-size: 18px; margin: 0 0 16px; }
      .doc { page-break-after: always; border-bottom: 1px solid #e2e8f0; padding-bottom: 24px; margin-bottom: 24px; }
      .doc:last-child { page-break-after: auto; border-bottom: 0; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 8px; }
      th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
      th { background: #f1f5f9; }
      .muted { color: #64748b; font-size: 12px; }
      .right { text-align: right; }
      .totals { margin-left: auto; max-width: 240px; margin-top: 12px; font-size: 12px; }
      .totals div { display: flex; justify-content: space-between; gap: 16px; padding: 2px 0; }
    </style>
  </head><body>${t}</body></html>`),n.document.close(),n.focus(),n.print(),!0):!1}function r(e){return new Intl.NumberFormat(`en-IN`,{style:`currency`,currency:`INR`,maximumFractionDigits:2}).format(e)}export{n as i,e as n,r,t};