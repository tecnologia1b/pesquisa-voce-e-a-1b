import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { getFirestore, doc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { firebaseConfig } from "./config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const $ = (s) => document.querySelector(s);

$("#login-btn").onclick = async () => {
  $("#login-erro").textContent = "";
  try { await signInWithEmailAndPassword(auth, $("#login-email").value.trim(), $("#login-senha").value); }
  catch (e) { $("#login-erro").textContent = "E-mail ou senha incorretos."; }
};

let iniciado = false;
onAuthStateChanged(auth, async (user) => {
  if (!user) { $("#login").style.display = "block"; $("#exibe").style.display = "none"; return; }
  const opSnap = await getDoc(doc(db, "operadores", user.uid));
  if (!opSnap.exists()) { $("#login-erro").textContent = "Essa conta não tem permissão de operador."; await signOut(auth); return; }
  $("#login").style.display = "none";
  $("#exibe").style.display = "flex";
  if (iniciado) return;
  iniciado = true;
  new QRCode($("#qr"), { text: "https://pesquisa.1b.org.br/?origem=culto", width: 420, height: 420, correctLevel: QRCode.CorrectLevel.M });
  onSnapshot(doc(db, "contador", "total"), (snap) => { $("#contagem-n").textContent = snap.exists() ? snap.data().n || 0 : 0; });
});
