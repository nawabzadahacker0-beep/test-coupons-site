async function registerUser(email, password, displayName) {
  try {
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    await db.collection("users").doc(cred.user.uid).set({
      uid: cred.user.uid, name: displayName, email, createdAt: firebase.firestore.FieldValue.serverTimestamp(), role: "user"
    });
    alert("Account created!"); location.reload();
  } catch (e) {
    if (e.code === 'auth/email-already-in-use') { alert("Ye email pehle se hai, Sign In karo"); switchAuthTab('login'); }
    else alert(e.message);
  }
}
async function loginUser(email, password) {
  try { await auth.signInWithEmailAndPassword(email, password); toggleAuthModal(false); location.reload(); }
  catch (e) { alert(e.message); }
}
auth.onAuthStateChanged((user) => {
  const box = document.getElementById("authButtons"); if (!box) return;
  if (user) box.innerHTML = `<span class="text-xs font-semibold hidden sm:inline">Hi, ${user.email.split('@')[0]}</span><button onclick="auth.signOut().then(()=>location.reload())" class="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold">Logout</button>`;
});
