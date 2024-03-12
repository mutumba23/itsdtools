import { initializeApp } from 'firebase/app'
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
  signOut,
  sendEmailVerification,
  updateProfile,
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth'
import {
  getFirestore,
  doc,
  updateDoc,
  setDoc,
  increment,
  getDocs,
  collection
} from 'firebase/firestore'
import { getYear, getMonth } from 'date-fns'

const firebaseConfig = {
  apiKey: import.meta.env.RENDERER_VITE_FIREBASE_API_KEY,
  authDomain: 'itsd-tools.firebaseapp.com',
  projectId: 'itsd-tools',
  storageBucket: 'itsd-tools.appspot.com',
  databaseURL: 'https://itsd-tools-default-rtdb.europe-west1.firebasedatabase.app/',
  messagingSenderId: '730668520505',
  appId: '1:730668520505:web:cceac07e86d18ed3fae9e8'
}

const firebaseApp = initializeApp(firebaseConfig) // Initialize Firebase
const auth = getAuth(firebaseApp) // Get Auth instance using the Firebase app
const db = getFirestore(firebaseApp) // Get Firestore instance using the Firebase app

// Enable local persistence
setPersistence(auth, browserLocalPersistence)
  .then(() => {

  })
  .catch((error) => {
    console.error('Error enabling local persistence:', error)
  })

async function updateMonthlyUsageCount(id, category) {
  try {
    // Construct the document ID using category prefix
    const documentId = `${category}_${id}`

    // Get the current year and month
    const currentDate = new Date()
    const currentYear = getYear(currentDate)
    const currentMonth = getMonth(currentDate) + 1 // January is 0, so we add 1

    // Construct the field path for the current month
    const fieldPath = `monthlyUsageCounts.${currentYear}-${currentMonth.toString().padStart(2, '0')}`

    // Get reference to the Firestore document
    const buttonRef = doc(db, 'button_clicks', documentId)

    // Update the monthlyUsageCounts field using Firestore's increment method
    await updateDoc(buttonRef, {
      [fieldPath]: increment(1) // Increment the value of the current month by 1
    })
  } catch (error) {
    console.error('Error updating monthly usage count:', error)
  }
}

async function createDocumentsFromArray(array, collectionName) {
  for (const element of array) {
    try {
      // Construct the document ID (you can use a unique ID or custom ID)
      const documentId = `${collectionName}_${element.id}`

      // Reference to the document in the specified collection
      const docRef = doc(db, 'button_clicks', documentId)

      // Create a new document object with the specified fields
      const newDocument = {
        category: collectionName,
        label: element.label !== undefined ? element.label : element.name,
        monthlyUsageCounts: {
          '2024-02': 0,
          '2024-03': 0,
          '2024-04': 0,
          '2024-05': 0,
          '2024-06': 0,
          '2024-07': 0,
          '2024-08': 0,
          '2024-09': 0,
          '2024-10': 0,
          '2024-11': 0,
          '2024-12': 0,
          '2025-01': 0,
          '2025-02': 0
        },
        totalUsageCount: 0
      }

      // Set document data
      await setDoc(docRef, newDocument)
      console.log(`Document created for ${element.id}`)
    } catch (error) {
      console.error('Error creating document:', error)
    }
  }
}

async function getButtonStatistics() {
  try {
    const querySnapshot = await getDocs(collection(db, 'button_clicks'))
    const statistics = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      // Push the data to the statistics array
      statistics.push({
        id: doc.id,
        category: data.category,
        label: data.label,
        monthlyUsageCounts: data.monthlyUsageCounts
      })
    })

    return statistics
  } catch (error) {
    console.error('Error getting button statistics:', error)
    return [] // Return an empty array if an error occurs
  }
}

let currentUser = null;
const handleAuthStateChange = (callback) => {
  onAuthStateChanged(auth, (user) => {
    if (user !== currentUser) {
      currentUser = user;
      callback(user);
    }
  });
};

const signout = () => {
  signOut(auth)
    .then(() => {
      // Perform any additional actions after sign out
      console.log('User signed out')
    })
    .catch((error) => {
      // Handle sign out error
      console.error('Error signing out:', error)
    })
}

const sendVerificationEmail = async () => {
  try {
    const user = auth.currentUser;
    if (user) {
      await sendEmailVerification(user);
    } else {
      console.error('No user signed in.');
    }
  } catch (error) {
    console.error('Error sending verification email:', error);
  }
};

const updateDisplayName = async (displayName) => {
  try {
    const user = auth.currentUser

    if (user) {
      await updateProfile(user, { displayName })
      console.log('Display name updated successfully')
    } else {
      console.error('No user signed in')
    }
  } catch (error) {
    console.error('Error updating display name:', error)
  }
}

const login = async (email, password) => {
  // Sign in with email and password
  return signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      // User is signed in
      console.log('User is logged in')
    })
    .catch((error) => {
      // Handle errors
      console.error('Error signing in:', error)
      throw error // Rethrow the error to be caught by the caller
    })
}

const resetPassword = async (email) => {
  if (!email) {
    throw new Error('Please enter your email address.')
  }

  try {
    // Send password reset email
    await sendPasswordResetEmail(getAuth(), email)
    console.log('Password reset email sent successfully.')
    return 'Password reset email sent successfully.'
  } catch (error) {
    // Handle errors
    console.error('Error sending password reset email:', error)
    throw error
  }
}

export {
  updateMonthlyUsageCount,
  createDocumentsFromArray,
  getButtonStatistics,
  handleAuthStateChange,
  signout,
  sendVerificationEmail,
  updateDisplayName,
  login,
  resetPassword,
  firebaseApp as default
}
