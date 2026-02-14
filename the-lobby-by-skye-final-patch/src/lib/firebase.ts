import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

// Embedded Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCQ4X9_lkGK7Eba4B8eSzmE9LlBSNLq4tU",
  authDomain: "thelobby-by-skye.firebaseapp.com",
  projectId: "thelobby-by-skye",
  storageBucket: "thelobby-by-skye.firebasestorage.app",
  messagingSenderId: "289104994787",
  appId: "1:289104994787:web:7955980946676cc25600d6",
  measurementId: "G-FR5Q37K8BX"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
