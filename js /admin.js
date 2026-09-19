const ADMIN_PASSWORD = "#2026!keepdetails$Secure786.pak";
let allStoresCache=[], allCouponsCache=[], allBlogsCache=[];
let currentBase64Image="";

document.addEventListener("DOMContentLoaded", () => {
  if (prompt("Enter Admin Strong Password:")!== ADMIN_PASSWORD) { alert("Wrong Password!"); window.location.href = "/"; return; }
  document.getElementById("adminMainContent").classList.remove("hidden");
  initAdminForms(); loadAllStoresForAdmin(); loadAllCouponsForAdmin(); loadAllCategoriesForAdmin(); loadAllBlogsForAdmin(); loadAboutForAdmin();

  const imgInput = document.getElementById("storeImageFile");
  if(imgInput){
    imgInput.addEventListener("change", (e)=>{
      const file=e.target.files[0]; if(!file) return;
      if(file.size > 800*1024){ alert("1st select image."); return; }
      const reader=new FileReader();
      reader.onload=function(ev){
        currentBase64Image=ev.target.result;
        const prev=document.getElementById("previewImg");
        prev.src=currentBase64Image; prev.classList.remove("hidden");
      };
      reader.readAsDataURL(file);
    });
  }
});

// TABS + SEARCH LOGIC - NEW
function showTab(tab){
  ['stores','coupons','addstore','addcoupon','cats'].forEach(t=>{
    document.getElementById('section-'+t).classList.add('hidden');
    document.getElementById('tab-'+t).classList.remove('tab-active');
    document.getElementById('tab-'+t).classList.add('bg-gray-100');
  });
  document.getElementById('section-'+tab).classList.remove('hidden');
  document.getElementById('tab-'+tab).classList.add('tab-active');
  document.getElementById('tab-'+tab).classList.remove('bg-gray-100');
  window.scrollTo({top:0,behavior:'smooth'});
}
function searchStores(){
  let input=document.getElementById('storeSearch').value.toLowerCase();
  let items=document.querySelectorAll('#adminStoreList.store-item');
  items.forEach(item=>{ item.style.display=item.innerText.toLowerCase().includes(input)?"":"none"; });
}
function searchCoupons(){
  let input=document.getElementById('couponSearch').value.toLowerCase();
  let items=document.querySelectorAll('#adminCouponList.coupon-item');
  items.forEach(item=>{ item.style.display=item.innerText.toLowerCase().includes(input)?"":"none"; });
}

function initAdminForms() {
  loadStoresDropdown(); loadCategoriesDropdown();
  document.getElementById("addStoreForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn=document.getElementById("storeSubmitBtn");
    btn.disabled=true; btn.innerText="Saving... Please Wait";
    try{
      const editId=document.getElementById("storeEditId").value;
      const name=document.getElementById("storeName").value.trim();
      const slug=name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
      let imageUrl=currentBase64Image;
      if(editId){
        if(!imageUrl || imageUrl===""){
          const oldDoc=await db.collection("stores").doc(editId).get();
          if(oldDoc.exists) imageUrl=oldDoc.data().image;
        }
      }
      if(!imageUrl || imageUrl===""){ alert("wait image uploading."); btn.disabled=false; btn.innerText="Save Store"; return; }
      const aboutStoreText = document.getElementById("storeAboutBox")?.value.trim() || "";
      const faqs = [];
      const q1=document.getElementById("faq1q")?.value.trim(); const a1=document.getElementById("faq1a")?.value.trim();
      const q2=document.getElementById("faq2q")?.value.trim(); const a2=document.getElementById("faq2a")?.value.trim();
      const q3=document.getElementById("faq3q")?.value.trim(); const a3=document.getElementById("faq3a")?.value.trim();
      if(q1 && a1) faqs.push({q:q1, a:a1});
      if(q2 && a2) faqs.push({q:q2, a:a2});
      if(q3 && a3) faqs.push({q:q3, a:a3});
      const data={ name, slug, image:imageUrl, description:document.getElementById("storeDesc").value.trim(), aboutStore: aboutStoreText, faqs: faqs, url:document.getElementById("storeUrl").value.trim(), secondaryUrl:document.getElementById("storeSecUrl").value.trim(), updatedAt:firebase.firestore.FieldValue.serverTimestamp() };
      if(editId){ await db.collection("stores").doc(editId).update(data); alert("Store Updated Successfully! ✅"); } else { data.createdAt=firebase.firestore.FieldValue.serverTimestamp(); await db.collection("stores").add(data); alert("Store Added Successfully!✅"); }
      e.target.reset(); document.getElementById("previewImg").classList.add("hidden"); document.getElementById("previewImg").src=""; currentBase64Image=""; document.getElementById("storeEditId").value="";
      document.getElementById("faq1q").value=""; document.getElementById("faq1a").value=""; document.getElementById("faq2q").value=""; document.getElementById("faq2a").value=""; document.getElementById("faq3q").value=""; document.getElementById("faq3a").value="";
      loadStoresDropdown(); loadAllStoresForAdmin(); showTab('stores');
    }catch(err){ alert("Error: "+err.message); console.error(err); }
    btn.disabled=false; btn.innerText="Save Store";
  });

  document.getElementById("addCouponForm").addEventListener("submit", async (e) => {
    e.preventDefault(); const editId=document.getElementById("couponEditId").value; const type=document.querySelector('input[name="type"]:checked').value; const sel=document.getElementById("couponStore"); const opt=sel.options[sel.selectedIndex];
    if(!opt.value){ alert("Store select karo"); return; }
    const sequenceVal = parseInt(document.getElementById("offerSequence").value) || 999;
    const data={ title:document.getElementById("couponTitle").value.trim(), description:document.getElementById("couponDesc").value.trim(), store:opt.value, storeSlug:opt.dataset.slug, category:document.getElementById("couponCategory").value, categorySlug:document.getElementById("couponCategory").value.toLowerCase(), type, code:type==='coupon'?document.getElementById("couponCode").value.trim():"", targetUrl:document.getElementById("couponUrl").value.trim(), sequence: sequenceVal, createdAt:firebase.firestore.FieldValue.serverTimestamp() };
    if(editId){ await db.collection("coupons").doc(editId).update(data); alert("Coupon Updated!"); document.getElementById("couponEditId").value=""; } else { await db.collection("coupons").add(data); alert("Published!"); }
    e.target.reset(); document.getElementById("offerSequence").value="1"; loadAllCouponsForAdmin(); showTab('coupons');
  });
  document.getElementById("addCategoryForm").addEventListener("submit", async (e)=>{ e.preventDefault(); const name=document.getElementById("newCategoryName").value.trim(); const slug=name.toLowerCase().replace(/[^a-z0-9]+/g,"-"); await db.collection("categories").add({name,slug,createdAt:firebase.firestore.FieldValue.serverTimestamp()}); e.target.reset(); loadCategoriesDropdown(); loadAllCategoriesForAdmin(); });
  document.getElementById("addBlogForm")?.addEventListener("submit", async (e)=>{ e.preventDefault(); const editId=document.getElementById("blogEditId").value; const data={title:document.getElementById("blogTitle").value.trim(), desc:document.getElementById("blogDesc").value.trim(), createdAt:firebase.firestore.FieldValue.serverTimestamp()}; if(editId){ await db.collection("blogs").doc(editId).update(data); alert("Blog Updated!"); document.getElementById("blogEditId").value=""; } else { await db.collection("blogs").add(data); alert("Blog Added!"); } e.target.reset(); loadAllBlogsForAdmin(); });
  document.getElementById("aboutForm")?.addEventListener("submit", async (e)=>{ e.preventDefault(); const content=document.getElementById("aboutContent").value.trim(); const snap=await db.collection("settings").doc("about").get(); if(snap.exists){ await db.collection("settings").doc("about").update({content}); } else { await db.collection("settings").doc("about").set({content}); } alert("About Updated!"); });
}
async function loadStoresDropdown(){ const sel=document.getElementById("couponStore"); if(!sel) return; const snap=await db.collection("stores").get(); sel.innerHTML='<option value="">Select Store</option>'; snap.forEach(d=>{ const s=d.data(); sel.innerHTML+=`<option value="${s.name}" data-slug="${s.slug}">${s.name}</option>`; }); }
async function loadCategoriesDropdown(){ const sel=document.getElementById("couponCategory"); if(!sel) return; const snap=await db.collection("categories").get(); if(snap.empty){ sel.innerHTML=`<option value="fashion">Fashion</option><option value="electronics">Electronics</option><option value="tech">Tech</option><option value="food">Food</option><option value="travel">Travel</option><option value="beauty">Beauty</option><option value="services">Services</option>`; return; } sel.innerHTML=""; snap.forEach(d=>{ const c=d.data(); sel.innerHTML+=`<option value="${c.slug}">${c.name}</option>`; }); }
async function loadAllStoresForAdmin(){ const snap=await db.collection("stores").get(); allStoresCache=snap.docs.map(doc=>({id:doc.id,data:doc.data()})); renderStoreList(allStoresCache); }
function renderStoreList(list){ const el=document.getElementById("adminStoreList"); const countEl=document.getElementById("storeCount"); if(!el) return; el.innerHTML=""; if(countEl) countEl.innerText=list.length+" Stores"; list.forEach(item=>{ const s=item.data; const docId=item.id; el.innerHTML+=`<div class="store-item flex justify-between items-center bg-white border p-3 rounded-lg mb-2"><div class="flex gap-2 items-center"><img src="${s.image}" class="w-10 h-10 object-contain border rounded bg-white" onerror="this.src='https://via.placeholder.com/100'"><div><b class="text-sm">${s.name}</b><p class="text-[11px] text-gray-500 line-clamp-1 max-w-[200px]">${s.description||''}</p></div></div><div class="flex gap-2"><button onclick="editStore('${docId}')" class="bg-blue-600 text-white text-xs px-3 py-1 rounded">Edit</button><button onclick="deleteStore('${docId}')" class="bg-red-500 text-white text-xs px-3 py-1 rounded">Delete</button></div></div>`; }); }
async function loadAllCouponsForAdmin(){ const snap=await db.collection("coupons").orderBy("sequence","asc").get().catch(async()=>{ return await db.collection("coupons").get(); }); allCouponsCache=snap.docs.map(doc=>({id:doc.id,data:doc.data()})); allCouponsCache.sort((a,b)=> (a.data.sequence||999) - (b.data.sequence||999)); renderCouponList(allCouponsCache); }
function renderCouponList(list){ const el=document.getElementById("adminCouponList"); const countEl=document.getElementById("couponCount"); if(!el) return; el.innerHTML=""; if(countEl) countEl.innerText=list.length+" Coupons"; list.forEach(item=>{ const c=item.data; el.innerHTML+=`<div class="coupon-item flex justify-between bg-white border p-3 rounded-lg mb-2"><div><b class="text-sm">[${c.sequence||1}] ${c.title}</b><br><span class="text-[11px] text-gray-500">${c.store} | ${c.category} | ${c.code||'DEAL'} | Seq: ${c.sequence||1}</span></div><div class="flex gap-2"><button onclick="editCoupon('${item.id}')" class="bg-blue-600 text-white text-xs px-3 py-1 rounded">Edit</button><button onclick="deleteCoupon('${item.id}')" class="bg-red-500 text-white text-xs px-3 py-1 rounded">Delete</button></div></div>`; }); }
async function loadAllCategoriesForAdmin(){ const list=document.getElementById("adminCategoryList"); if(!list) return; const snap=await db.collection("categories").get(); list.innerHTML=""; snap.forEach(doc=>{ const c=doc.data(); list.innerHTML+=`<div class="flex justify-between bg-white border p-2 rounded mb-2 text-sm"><span>${c.name} (${c.slug})</span><button onclick="deleteCategory('${doc.id}')" class="bg-red-500 text-white text-xs px-2 py-1 rounded">Delete</button></div>`; }); }
async function loadAllBlogsForAdmin(){ const snap=await db.collection("blogs").get(); allBlogsCache=snap.docs.map(doc=>({id:doc.id,data:doc.data()})); renderBlogList(allBlogsCache); }
function renderBlogList(list){ const el=document.getElementById("adminBlogList"); if(!el) return; el.innerHTML=""; list.forEach(item=>{ const b=item.data; el.innerHTML+=`<div class="flex justify-between bg-white border p-3 rounded mb-2"><div><b class="text-sm">${b.title}</b><p class="text-xs text-gray-500 line-clamp-1">${b.desc}</p></div><div class="flex gap-2"><button onclick="editBlog('${item.id}')" class="bg-blue-600 text-white text-xs px-3 py-1 rounded">Edit</button><button onclick="deleteBlog('${item.id}')" class="bg-red-500 text-white text-xs px-3 py-1 rounded">Delete</button></div></div>`; }); }
async function loadAboutForAdmin(){ try{ const doc=await db.collection("settings").doc("about").get(); if(doc.exists && document.getElementById("aboutContent")){ document.getElementById("aboutContent").value=doc.data().content; } }catch(e){} }
async function editStore(id){ const doc=await db.collection("stores").doc(id).get(); const s=doc.data(); showTab('addstore'); document.getElementById("storeEditId").value=id; document.getElementById("storeName").value=s.name; document.getElementById("storeDesc").value=s.description||""; document.getElementById("storeAboutBox").value=s.aboutStore||""; document.getElementById("storeUrl").value=s.url; document.getElementById("storeSecUrl").value=s.secondaryUrl||"";
 if(s.faqs && s.faqs.length>0){
   if(s.faqs[0]){ document.getElementById("faq1q").value=s.faqs[0].q||""; document.getElementById("faq1a").value=s.faqs[0].a||""; }
   if(s.faqs[1]){ document.getElementById("faq2q").value=s.faqs[1].q||""; document.getElementById("faq2a").value=s.faqs[1].a||""; }
   if(s.faqs[2]){ document.getElementById("faq3q").value=s.faqs[2].q||""; document.getElementById("faq3a").value=s.faqs[2].a||""; }
 }
 currentBase64Image=s.image; const prev=document.getElementById("previewImg"); prev.src=s.image; prev.classList.remove("hidden"); document.getElementById("storeSubmitBtn").innerText="Update Store"; }
async function editCoupon(id){ const doc=await db.collection("coupons").doc(id).get(); const c=doc.data(); showTab('addcoupon'); document.getElementById("couponEditId").value=id; document.getElementById("couponTitle").value=c.title; document.getElementById("couponDesc").value=c.description; document.getElementById("couponUrl").value=c.targetUrl; document.getElementById("couponCode").value=c.code||""; document.getElementById("offerSequence").value=c.sequence||1; if(c.category){ document.getElementById("couponCategory").value=c.categorySlug||c.category; } }
async function editBlog(id){ const doc=await db.collection("blogs").doc(id).get(); const b=doc.data(); document.getElementById("blogEditId").value=id; document.getElementById("blogTitle").value=b.title; document.getElementById("blogDesc").value=b.desc; }
async function deleteStore(id){ if(!confirm("Delete Store?")) return; await db.collection("stores").doc(id).delete(); loadAllStoresForAdmin(); loadStoresDropdown(); }
async function deleteCoupon(id){ if(!confirm("Delete Coupon?")) return; await db.collection("coupons").doc(id).delete(); loadAllCouponsForAdmin(); }
async function deleteCategory(id){ if(!confirm("Delete Category?")) return; await db.collection("categories").doc(id).delete(); loadAllCategoriesForAdmin(); loadCategoriesDropdown(); }
async function deleteBlog(id){ if(!confirm("Delete Blog?")) return; await db.collection("blogs").doc(id).delete(); loadAllBlogsForAdmin(); }
async function exportAllData(){ const backup={}; const stores=await db.collection("stores").get(); backup.stores=stores.docs.map(d=>d.data()); const coupons=await db.collection("coupons").get(); backup.coupons=coupons.docs.map(d=>d.data()); const cats=await db.collection("categories").get(); backup.categories=cats.docs.map(d=>d.data()); const blogs=await db.collection("blogs").get(); backup.blogs=blogs.docs.map(d=>d.data()); const blob=new Blob([JSON.stringify(backup,null,2)],{type:"application/json"}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=`backup_${new Date().toISOString().split('T')[0]}.json`; a.click(); alert("Backup Downloaded!"); }
