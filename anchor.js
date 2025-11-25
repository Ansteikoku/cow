export function convertAnchors(text){
  if(!text) return '';
  // >>123 or &gt;&gt;123
  return text.replace(/&gt;&gt;([0-9]+)/g, (m,n)=>`<a href="#res-${n}" class="anchor">>>${n}</a>`).replace(/>>([0-9]+)/g, (m,n)=>`<a href="#res-${n}" class="anchor">>>${n}</a>`);
}
