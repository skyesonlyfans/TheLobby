import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { mustEnv } from './env'

const firebaseConfig = {
  apiKey: mustEnv('VITE_FIREBASE_API_KEY'),
  authDomain: mustEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: mustEnv('VITE_FIREBASE_PROJECT_ID'),
  appId: mustEnv('VITE_FIREBASE_APP_ID'),
  messagingSenderId: mustEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
