let allCoupons=[]; let allStores=[]; let isExpanded=false;
document.addEventListener("DOMContentLoaded",()=>{
  loadStores(); loadCoupons(); loadSingleStoreHeader(); loadCategoriesGrid(); loadBlogs(); loadAbout();
  document.getElementById("copyBtn")?.addEventListener("click",copyCouponCode);
  document.getElementById("closeModal")?.addEventListener("click",()=>document.getElementById("couponModal").classList.add("hidden"));
  document.getElementById("mainSearchInput")?.addEventListener("input",handleMainSearch);
});
async function loadStores(){const g=document.getElementById("storesGrid");if(!g)return;const s=await db.collection("stores").get();if(s.empty){g.innerHTML="<p class='col-span-4 text-center text-gray-400 py-10'>No Stores Yet</p>";return;}allStores=[];s.forEach(d=>allStores.push(d.data()));renderStores(allStores);}
function renderStores(list){const g=document.getElementById("storesGrid");if(!g)return;if(list.length==0){g.innerHTML="<p class='col-span-4 text-center text-gray-400 py-10'>No Store Found</p>";return;}g.innerHTML="";list.forEach(s=>{g.innerHTML+=`<a href="/store/${s.slug}" class="store-card bg-white border rounded-xl p-4 flex flex-col items-center text-center hover:border-[#00c98b] hover:shadow"><img src="${s.image}" class="h-14 w-14 object-contain mb-3 bg-white rounded" onerror="this.src='https://via.placeholder.com/100'"><b class="text-[15px] text-[#1d3266]">${s.name}</b><span class="text-[11px] text-gray-400 mt-1 line-clamp-2">${(s.description||'').substring(0,60)}</span></a>`;});}

// FIXED FOR PAID HOSTING - SUPPORTS BOTH /store/slug AND?store=slug
function getSlugFromUrl(){
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('store') || urlParams.get('id') || urlParams.get('cat') || window.location.pathname.split('/').pop();
}

async function loadSingleStoreHeader(){
 const header=document.getElementById("storeHeader"); if(!header) return;
 const slug=getSlugFromUrl(); if(!slug||slug=='store' || slug=='store.html') return;
 const snap=await db.collection("stores").where("slug","==",slug).limit(1).get();
 if(snap.empty) return;
 const s=snap.docs[0].data();
 const finalLink = (s.secondaryUrl && s.secondaryUrl.trim()!== "")? s.secondaryUrl : s.url;
 header.innerHTML=`<div class="bg-white border rounded-xl p-6 flex flex-col md:flex-row gap-6 mb-6"><img src="${s.image}" class="h-20 w-20 object-contain border rounded-lg p-2 bg-white" onerror="this.src='https://via.placeholder.com/100'"><div><h1 class="text-2xl font-extrabold text-[#1d3266]">${s.name}</h1><p class="text-sm text-gray-600 mt-2 leading-relaxed">${(s.description||'').substring(0,120)}...</p><div class="flex gap-3 mt-3"><a href="${finalLink}" target="_blank" class="text-xs bg-[#1d3266] text-white px-5 py-2 rounded font-bold">Visit Store <i class="fa-solid fa-arrow-up-right-from-square ml-1"></i></a></div></div></div>`;
 if(document.getElementById("storeTitle")) document.getElementById("storeTitle").innerText=s.name+" Coupons & Deals";
 const longDesc=document.getElementById("storeLongDesc"); const btn=document.getElementById("readMoreBtn");
 if(longDesc){ longDesc.innerText=s.description||'No description'; if((s.description||'').length>120){ btn.classList.remove("hidden"); } }
 if(document.getElementById("aboutStoreImg")) document.getElementById("aboutStoreImg").src=s.image;
 if(document.getElementById("aboutStoreName")) document.getElementById("aboutStoreName").innerText=s.name;
 if(document.getElementById("aboutStoreText")) document.getElementById("aboutStoreText").innerText=s.aboutStore||s.description||'Best deals for '+s.name;
 if(document.getElementById("aboutStoreLink")) document.getElementById("aboutStoreLink").href=finalLink;
 const title=`${s.name} Coupons & Promo Codes - Flat 50% OFF | FREE COUPON`;
 document.title=title;
 if(document.getElementById("pageTitle")) document.getElementById("pageTitle").innerText=title;
}
window.toggleReadMore=function(){isExpanded=!isExpanded;const d=document.getElementById("storeLongDesc");const b=document.getElementById("readMoreBtn");if(isExpanded){d.classList.remove("clamp-2");d.classList.add("clamp-open");b.innerHTML=`Read Less <i class="fa-solid fa-chevron-up ml-1"></i>`;}else{d.classList.add("clamp-2");d.classList.remove("clamp-open");b.innerHTML=`Read More <i class="fa-solid fa-chevron-down ml-1"></i>`;}}
window.toggleFaq=function(i){document.getElementById(`faqA${i}`)?.classList.toggle("hidden");document.getElementById(`faqI${i}`)?.classList.toggle("fa-chevron-down");document.getElementById(`faqI${i}`)?.classList.toggle("fa-chevron-up");}
async function loadCoupons(){
  const c=document.getElementById("couponsContainer");if(!c)return;
  const path=window.location.pathname;
  const slug=getSlugFromUrl();
  let snap;
  if(path.includes("/store") || window.location.search.includes("store=")) snap=await db.collection("coupons").where("storeSlug","==",slug).get();
  else if(path.includes("/category") || window.location.search.includes("cat=")) snap=await db.collection("coupons").where("categorySlug","==",slug).get();
  else snap=await db.collection("coupons").get();
  allCoupons=[];snap.forEach(d=>allCoupons.push({id:d.id,...d.data()}));
  // SEQUENCE SORT - NEW
  allCoupons.sort((a,b)=> (a.sequence||999) - (b.sequence||999));
  renderCoupons(allCoupons);
}
function renderCoupons(list){const c=document.getElementById("couponsContainer");if(!c)return;if(list.length==0){c.innerHTML="<p class='text-center text-gray-400 py-10 bg-white border rounded-xl'>No Coupons Found</p>";return;}c.innerHTML="";list.forEach(co=>{c.innerHTML+=`<div class="bg-white border rounded-xl p-4 flex items-center justify-between hover:shadow-md"><div class="flex items-center gap-3"><div class="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center font-extrabold text-[#1d3266] text-xs">${co.store.substring(0,2).toUpperCase()}</div><div><h3 class="font-bold text-[14px] text-[#1d3266]">${co.title}</h3><p class="text-[12px] text-gray-500 max-w-[250px] md:max-w-md truncate">${co.description}</p><div class="flex gap-2 mt-1"><span class="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-bold">${co.store}</span><span class="text-[10px] bg-gray-100 px-2 py-0.5 rounded">${co.category}</span></div></div></div><button onclick="openCouponModal('${co.id}')" class="bg-[#3258b3] text-white text-xs font-bold px-5 py-2.5 rounded-lg">${co.type==='coupon'?'SHOW CODE':'VIEW DEAL'}</button></div>`;});}
function handleMainSearch(e){const q=e.target.value.toLowerCase();if(q.length==0){renderStores(allStores);renderCoupons(allCoupons);return;}const fs=allStores.filter(s=>s.name.toLowerCase().includes(q));renderStores(fs);const fc=allCoupons.filter(c=>c.title.toLowerCase().includes(q));renderCoupons(fc);}
async function loadCategoriesGrid(){const g=document.getElementById("catGrid");if(!g)return;const s=await db.collection("categories").get();if(s.empty){g.innerHTML="<p>No categories</p>";return;}g.innerHTML="";s.forEach(d=>{const c=d.data();g.innerHTML+=`<a href="/category/${c.slug}" class="bg-white p-8 rounded-xl border text-center font-bold hover:border-[#00c98b]">${c.name}</a>`;});}
async function loadBlogs(){const c=document.getElementById("blogList");if(!c)return;const s=await db.collection("blogs").get();if(s.empty){c.innerHTML="<p>No blogs</p>";return;}c.innerHTML="";s.forEach(doc=>{const b=doc.data();c.innerHTML+=`<div class="bg-white border rounded-xl p-6"><h3 class="font-bold text-lg text-[#1d3266]">${b.title}</h3><p class="text-sm text-gray-600 mt-2">${b.desc}</p></div>`;});}
async function loadAbout(){const el=document.getElementById("aboutContentDisplay");if(!el)return;const d=await db.collection("settings").doc("about").get();if(d.exists)el.innerText=d.data().content;}
function openCouponModal(id){const c=allCoupons.find(x=>x.id==id);if(!c)return;document.getElementById("modalTitle").innerText=c.title;document.getElementById("modalDesc").innerText=c.description;document.getElementById("modalCode").innerText=c.code||"DEAL ACTIVATED";document.getElementById("storeRedirectLink").href=c.targetUrl;const box=document.getElementById("modalCodeBox");if(c.type==='deal')box.classList.add("hidden");else box.classList.remove("hidden");document.getElementById("couponModal").classList.remove("hidden");}
function copyCouponCode(){const code=document.getElementById("modalCode").innerText;navigator.clipboard.writeText(code);const b=document.getElementById("copyBtn");b.innerText="COPIED!";setTimeout(()=>b.innerText="COPY",1500);}
