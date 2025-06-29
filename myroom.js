import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, query, where, getDocs, deleteDoc, writeBatch } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Home, User, Building2, MapPin, Phone, ShieldCheck, Search, PlusCircle, CheckCircle, CircleDot, Star, Wrench, Eye, Trash2, Image as ImageIcon } from 'lucide-react'; // Simplified icons

// Ensure these global variables are defined in the environment
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Initialize Firebase App outside of the component to avoid re-initialization
let firebaseApp;
let db;
let auth;
let storage;

try {
    firebaseApp = initializeApp(firebaseConfig);
    db = getFirestore(firebaseApp);
    auth = getAuth(firebaseApp);
    storage = getStorage(firebaseApp);
} catch (error) {
    console.error("Firebase initialization error:", error);
}

// Translations for Marathi and English
const translations = {
    mr: {
        appName: "माझी खोली",
        tagline: "शहरातील तुमच्या कॉलेजजवळची परफेक्ट रूम!",
        loginTitle: "लॉगिन करा किंवा भूमिकेची निवड करा",
        loginButton: "लॉगिन करा",
        languageToggle: "इंग्रजी",
        selectRole: "तुमची भूमिका निवडा",
        student: "विद्यार्थी (खोली शोधणारा)",
        owner: "घरमालक (खोली देणारा)",
        admin: "अ‍ॅडमिन",
        logout: "लॉगआउट करा",
        welcomeStudent: "विद्यार्थी डॅशबोर्ड",
        welcomeOwner: "घरमालक डॅशबोर्ड",
        addListing: "नवीन खोलीची माहिती जोडा",
        myListings: "माझ्या खोल्या",
        roomTitle: "खोलीचे नाव/वर्णन",
        rent: "भाडे (₹/महिना)",
        amenities: "सुविधा (उदा. शेजारी शौचालय, भाजीपाला)",
        contactInfo: "संपर्क माहिती (WhatsApp/फोन)",
        location: "ठिकाण (कॉलेजचे नाव/पत्ता)",
        uploadPhoto: "छायाचित्र अपलोड करा",
        submitListing: "माहिती सबमिट करा",
        searchRooms: "खोल्या शोधा",
        collegeName: "कॉलेजचे नाव",
        budget: "बजेट (उदा. ₹3000-5000)",
        safety: "सुरक्षितता (उदा. महिलांसाठी/PG)",
        search: "शोधा",
        nearYou: "तुमच्या जवळ",
        verifiedOwner: "सत्यापित मालक",
        studentPreferred: "विद्यार्थी-पसंतीचा",
        bookRoom: "खोली बुक करा",
        markAsBooked: "बुक केली म्हणून चिन्हांकित करा",
        listingSuccess: "खोलीची माहिती यशस्वीरित्या जोडली!",
        listingError: "खोलीची माहिती जोडताना त्रुटी आली.",
        loading: "लोड करत आहे...",
        noListings: "कोणत्याही खोल्या उपलब्ध नाहीत.",
        noOwnerListings: "तुमच्याकडे कोणतीही लिस्टिंग नाही.",
        ownerContact: "मालकाशी संपर्क साधा:",
        roomDetails: "खोलीचे तपशील",
        address: "पत्ता",
        actions: "क्रिया",
        deleteListing: "लिस्टिंग हटवा",
        deleteConfirm: "तुम्हाला ही लिस्टिंग हटवायची आहे का?",
        editListing: "लिस्टिंग संपादित करा",
        updateListing: "लिस्टिंग अपडेट करा",
        userId: "वापरकर्ता आयडी:",
        description: "वर्णन",
        uploadingImage: "प्रतिमा अपलोड करत आहे...",
        imageUploadSuccess: "प्रतिमा यशस्वीरित्या अपलोड केली!",
        imageUploadError: "प्रतिमा अपलोड करताना त्रुटी आली.",
        selectImage: "प्रतिमा निवडा",
        newLabel: "नवीन",
        addReview: "पुनरावलोकन जोडा",
        yourRating: "तुमचे रेटिंग:",
        yourReview: "तुमचे पुनरावलोकन:",
        submitReview: "पुनरावलोकन सबमिट करा",
        reviews: "पुनरावलोकने",
        noReviews: "या लिस्टिंगसाठी कोणतेही पुनरावलोकन नाही.",
        viewOnMap: "नकाशावर पहा",
        rateThisListing: "या लिस्टिंगला रेट करा",
        averageRating: "सरासरी रेटिंग",
        approve: "मंजूर",
        reject: "नाकारा",
        pending: "प्रलंबित",
        approved: "मंजूर",
        rejected: "नाकारले",
    },
    en: {
        appName: "MyRoom",
        tagline: "Perfect room near your city college!",
        loginTitle: "Login or Select Role",
        loginButton: "Login",
        languageToggle: "Marathi",
        selectRole: "Select Your Role",
        student: "Student (Seeking Room)",
        owner: "House Owner (Listing Room)",
        admin: "Admin",
        logout: "Logout",
        welcomeStudent: "Student Dashboard",
        welcomeOwner: "House Owner Dashboard",
        addListing: "Add New Room Listing",
        myListings: "My Listings",
        roomTitle: "Room Title/Description",
        rent: "Rent (₹/month)",
        amenities: "Amenities (e.g., Attached toilet, Vegetable market nearby)",
        contactInfo: "Contact Information (WhatsApp/Call)",
        location: "Location (College Name/Address)",
        uploadPhoto: "Upload Photo",
        submitListing: "Submit Listing",
        searchRooms: "Search Rooms",
        collegeName: "College Name",
        budget: "Budget (e.g., ₹3000-5000)",
        safety: "Safety (e.g., For women only/PG)",
        search: "Search",
        nearYou: "Near You",
        verifiedOwner: "Verified Owner",
        studentPreferred: "Student-Preferred",
        bookRoom: "Book Room",
        markAsBooked: "Mark as Booked",
        listingSuccess: "Listing added successfully!",
        listingError: "Error adding listing.",
        loading: "Loading...",
        noListings: "No rooms available.",
        noOwnerListings: "You have no listings.",
        ownerContact: "Contact Owner:",
        roomDetails: "Room Details",
        address: "Address",
        actions: "Actions",
        deleteListing: "Delete Listing",
        deleteConfirm: "Are you sure you want to delete this listing?",
        editListing: "Edit Listing",
        updateListing: "Update Listing",
        userId: "User ID:",
        description: "Description",
        uploadingImage: "Uploading image...",
        imageUploadSuccess: "Image uploaded successfully!",
        imageUploadError: "Error uploading image.",
        selectImage: "Select Image",
        newLabel: "New",
        addReview: "Add Review",
        yourRating: "Your Rating:",
        yourReview: "Your Review:",
        submitReview: "Submit Review",
        reviews: "Reviews",
        noReviews: "No reviews for this listing yet.",
        viewOnMap: "View on Map",
        rateThisListing: "Rate this Listing",
        averageRating: "Average Rating",
        approve: "Approve",
        reject: "Reject",
        pending: "Pending",
        approved: "Approved",
        rejected: "Rejected",
    }
};

// Centralized state management for Firebase Context
const FirebaseContext = React.createContext(null);

// Custom hook to use Firebase instances
function useFirebase() {
    return React.useContext(FirebaseContext);
}

// Firebase Provider component to initialize Firebase and manage auth state
function FirebaseProvider({ children }) {
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [dbInstance, setDbInstance] = useState(null);
    const [authInstance, setAuthInstance] = useState(null);
    const [storageInstance, setStorageInstance] = useState(null);

    useEffect(() => {
        const initializeAndSignIn = async () => {
            // Check if Firebase services are initialized
            if (!firebaseApp || !auth || !db || !storage) {
                console.error("Firebase services not initialized. Check config.");
                return;
            }

            // Set Firebase instances to state
            setDbInstance(db);
            setAuthInstance(auth);
            setStorageInstance(storage);

            // Attempt to sign in with custom token or anonymously
            // The 'auth/invalid-claims' error often means the token is malformed or expired.
            // We should ensure a fallback to anonymous sign-in in such cases.
            if (initialAuthToken && typeof initialAuthToken === 'string' && initialAuthToken.length > 0) {
                console.log("Attempting sign-in with custom token...");
                try {
                    await signInWithCustomToken(auth, initialAuthToken);
                    console.log("Signed in with custom token.");
                } catch (error) {
                    console.error("Error signing in with custom token:", error);
                    console.log("Falling back to anonymous sign-in due to custom token error...");
                    try {
                        await signInAnonymously(auth);
                        console.log("Signed in anonymously after custom token failure.");
                    } catch (anonError) {
                        console.error("Error signing in anonymously after custom token failure:", anonError);
                    }
                }
            } else {
                console.log("No valid custom token found. Attempting anonymous sign-in...");
                try {
                    await signInAnonymously(auth);
                    console.log("Signed in anonymously.");
                } catch (anonError) {
                    console.error("Error signing in anonymously:", anonError);
                }
            }
        };

        initializeAndSignIn();

        // Listen for authentication state changes
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUserId(user.uid);
                console.log("Authenticated user ID:", user.uid); // Log user ID on auth change
            } else {
                // If no user, generate a random ID for unauthenticated sessions
                // This ID will be used for Firestore operations that don't require specific user auth
                setUserId(crypto.randomUUID());
                console.log("Unauthenticated session. Generated user ID:", userId);
            }
            setIsAuthReady(true); // Mark auth as ready
        });

        return () => unsubscribe(); // Cleanup the listener on component unmount
    }, []); // Empty dependency array ensures this runs once on mount

    return (
        <FirebaseContext.Provider value={{ db: dbInstance, auth: authInstance, storage: storageInstance, userId, isAuthReady }}>
            {children}
        </FirebaseContext.Provider>
    );
}

// Main App component
function App() {
    const { db, auth, userId, isAuthReady } = useFirebase();

    const [userRole, setUserRole] = useState(null); // 'student', 'owner', 'admin'
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isMarathi, setIsMarathi] = useState(true);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showAdminLoginModal, setShowAdminLoginModal] = useState(false); // Declared here
    const [loadingColor] = useState('#4F46E5'); // Default loading color (simplified, no random colors)

    const text = isMarathi ? translations.mr : translations.en;

    // Effect to handle login state based on Firebase authentication readiness
    useEffect(() => {
        if (isAuthReady) {
            setIsLoggedIn(true);
        }
    }, [isAuthReady]);

    // Handle user logout
    const handleLogout = async () => {
        if (auth) {
            try {
                await auth.signOut();
            } catch (error) {
                console.error("Error signing out:", error);
            }
        }
        setIsLoggedIn(false);
        setUserRole(null);
    };

    // Toggle application language
    const toggleLanguage = () => {
        setIsMarathi(!isMarathi);
    };

    // Show loading screen until authentication is ready
    if (!isAuthReady) {
        return (
            <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-green-100 to-blue-200 z-50">
                <div className="animate-fade-in flex flex-col items-center p-8 bg-white/90 rounded-3xl shadow-2xl backdrop-blur-sm">
                    {/* Home icon with a subtle bounce and pulse */}
                    <Home className="mb-6 text-green-500 animate-bounce-pulse" size={80} /> 
                    <h1 className="text-5xl font-extrabold text-gray-800 mb-3 drop-shadow-md animate-fade-in-up">{text.appName}</h1>
                    <p className="text-xl text-gray-700 italic mb-10 text-center px-4 animate-fade-in-up delay-200">{text.tagline}</p>
                    <div className="relative w-24 h-24">
                        {/* More professional loading spinner with distinct rings */}
                        <div className="absolute inset-0 border-4 border-solid rounded-full border-t-transparent border-blue-500 animate-spin-fast"></div>
                        <div className="absolute inset-2 border-4 border-dashed rounded-full border-b-transparent border-green-400 animate-spin-slow-reverse"></div>
                    </div>
                </div>
                {/* CSS for new animations */}
                <style>{`
                    @keyframes fade-in {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    .animate-fade-in {
                        animation: fade-in 2s ease-out forwards; /* Increased from 1s */
                    }
                    @keyframes bounce-pulse {
                        0%, 100% { transform: translateY(-15%); opacity: 1; }
                        50% { transform: translateY(0); opacity: 0.7; }
                    }
                    .animate-bounce-pulse {
                        animation: bounce-pulse 5s infinite; /* Increased from 2.5s */
                    }
                    @keyframes fade-in-up {
                        from { opacity: 0; transform: translateY(20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    .animate-fade-in-up {
                        animation: fade-in-up 1.5s ease-out forwards; /* Increased from 0.8s */
                    }
                    .animate-fade-in-up.delay-200 {
                        animation-delay: 0.2s;
                    }
                    @keyframes spin-fast {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                    .animate-spin-fast {
                        animation: spin-fast 3s linear infinite; /* Increased from 1s */
                    }
                    @keyframes spin-slow-reverse {
                        from { transform: rotate(360deg); }
                        to { transform: rotate(0deg); }
                    }
                    .animate-spin-slow-reverse {
                        animation: spin-slow-reverse 4.5s linear infinite; /* Increased from 1.5s */
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 p-4 font-inter flex flex-col items-center">
            {/* Header Section */}
            <header className="w-full max-w-4xl bg-white shadow-xl rounded-xl p-6 mb-8 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                <div className="text-center sm:text-left">
                    <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center sm:justify-start">
                        <Home className="mr-3 text-green-500" size={36} /> {text.appName}
                    </h1>
                    <p className="text-lg text-gray-600 italic">{text.tagline}</p>
                </div>
                <div className="flex items-center space-x-4">
                    <button
                        onClick={toggleLanguage}
                        className="px-5 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 transition duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                    >
                        {text.languageToggle}
                    </button>
                    {isLoggedIn && (
                        <button
                            onClick={handleLogout}
                            className="px-5 py-2 bg-red-500 text-white font-semibold rounded-lg shadow-md hover:bg-red-600 transition duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
                        >
                            {text.logout}
                        </button>
                    )}
                </div>
            </header>

            {/* Main Content Area */}
            <main className="w-full max-w-4xl bg-white shadow-xl rounded-xl p-8 flex flex-col items-center flex-grow">
                {isLoggedIn ? (
                    <>
                        {userRole ? (
                            // Render dashboard based on selected role
                            <>
                                <p className="text-lg text-gray-600 mb-4 text-center">
                                    {text.userId} <span className="font-mono text-sm break-all">{userId}</span>
                                </p>
                                {userRole === 'student' && <StudentDashboard text={text} userId={userId} db={db} />}
                                {userRole === 'owner' && <OwnerDashboard text={text} userId={userId} db={db} storage={storage} />}
                                {userRole === 'admin' && <AdminDashboard text={text} userId={userId} db={db} />}
                            </>
                        ) : (
                            // Role selection screen
                            <div className="flex flex-col items-center space-y-6 animate-fade-in">
                                <h2 className="text-3xl font-semibold text-gray-800 mb-6 drop-shadow-sm">{text.selectRole}</h2>
                                <button
                                    onClick={() => setUserRole('student')}
                                    className="w-full sm:w-80 px-8 py-4 bg-purple-500 text-white text-xl font-bold rounded-xl shadow-lg hover:bg-purple-600 transition duration-300 transform hover:scale-105 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2"
                                >
                                    <User className="mr-3" /> {text.student}
                                </button>
                                <button
                                    onClick={() => setUserRole('owner')}
                                    className="w-full sm:w-80 px-8 py-4 bg-teal-500 text-white text-xl font-bold rounded-xl shadow-lg hover:bg-teal-600 transition duration-300 transform hover:scale-105 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2"
                                >
                                    <Building2 className="mr-3" /> {text.owner}
                                </button>
                                <button
                                    onClick={() => setShowAdminLoginModal(true)}
                                    className="w-full sm:w-80 px-8 py-4 bg-orange-500 text-white text-xl font-bold rounded-xl shadow-lg hover:bg-orange-600 transition duration-300 transform hover:scale-105 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2"
                                >
                                    <ShieldCheck className="mr-3" /> {text.admin}
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    // Login screen (mock OTP)
                    <div className="flex flex-col items-center justify-center animate-fade-in">
                        <h2 className="text-3xl font-semibold text-gray-800 mb-6 drop-shadow-sm">{text.loginTitle}</h2>
                        <button
                            onClick={() => setShowLoginModal(true)}
                            className="px-10 py-5 bg-green-500 text-white text-2xl font-bold rounded-xl shadow-lg hover:bg-green-600 transition duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
                        >
                            {text.loginButton}
                        </button>
                        {showLoginModal && (
                            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                                <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full text-center border-4 border-blue-200 transform scale-95 animate-scale-in">
                                    <h3 className="text-2xl font-bold text-gray-800 mb-6">OTP Login (Mock)</h3>
                                    <input
                                        type="tel"
                                        placeholder="Enter Phone Number"
                                        className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none"
                                    />
                                    <button
                                        onClick={() => { setIsLoggedIn(true); setShowLoginModal(false); }} // Directly set logged in
                                        className="w-full px-6 py-3 bg-indigo-500 text-white font-semibold rounded-xl shadow-md hover:bg-indigo-600 transition duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
                                    >
                                        Send OTP (Mock)
                                    </button>
                                    <button
                                        onClick={() => setShowLoginModal(false)}
                                        className="mt-4 w-full px-6 py-3 bg-gray-300 text-gray-800 font-semibold rounded-xl shadow-md hover:bg-gray-400 transition duration-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Admin Login Modal */}
            {showAdminLoginModal && (
                <AdminLoginModal
                    text={text}
                    onClose={() => setShowAdminLoginModal(false)}
                    onLogin={() => {
                        setUserRole('admin');
                        setIsLoggedIn(true);
                        setShowAdminLoginModal(false);
                    }}
                />
            )}
        </div>
    );
}

// Admin Login Modal component
function AdminLoginModal({ text, onClose, onLogin }) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const ADMIN_PASSWORD = 'adminpass'; // Mock admin password

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        if (password === ADMIN_PASSWORD) {
            onLogin();
        } else {
            setError('Incorrect password.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center border-4 border-orange-200 transform scale-95 animate-scale-in">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-3xl font-bold p-1 rounded-full hover:bg-gray-100 transition duration-200"
                >
                    &times;
                </button>
                <h3 className="text-2xl font-bold text-gray-800 mb-6">{text.admin} Login</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="password"
                        placeholder="Admin Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent outline-none"
                        required
                    />
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <button
                        type="submit"
                        className="w-full px-6 py-3 bg-orange-500 text-white font-semibold rounded-xl shadow-md hover:bg-orange-600 transition duration-300 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2"
                    >
                        Login as {text.admin}
                    </button>
                </form>
            </div>
        </div>
    );
}

// Star Rating component for reviews
const StarRating = ({ rating, setRating, size = 20 }) => {
    return (
        <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <span
                    key={star}
                    className={`cursor-pointer ${star <= rating ? 'text-yellow-500' : 'text-gray-300'}`}
                    onClick={() => setRating(star)}
                    style={{ fontSize: `${size}px` }}
                >
                    ★
                </span>
            ))}
        </div>
    );
};

// Student Dashboard component
function StudentDashboard({ text, userId, db }) {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchCollege, setSearchCollege] = useState('');
    const [searchBudget, setSearchBudget] = useState('');
    const [searchSafety, setSearchSafety] = useState('');
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedListing, setSelectedListing] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [userRating, setUserRating] = useState(0);
    const [userReviewText, setUserReviewText] = useState('');
    const [showReviewForm, setShowReviewForm] = useState(false);

    // Fetch approved listings from Firestore
    useEffect(() => {
        if (!db) return;

        const collectionRef = collection(db, `artifacts/${appId}/public/data/listings`);
        const q = query(collectionRef, where("status", "==", "approved")); // Only show approved listings
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedListings = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })).filter(listing => !listing.isBooked); // Only show unbooked listings
            setListings(fetchedListings);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching listings:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [db]);

    // Fetch reviews for the selected listing
    useEffect(() => {
        if (!db || !selectedListing) return;
        const reviewsRef = collection(db, `artifacts/${appId}/public/data/listings/${selectedListing.id}/reviews`);
        const unsubscribe = onSnapshot(reviewsRef, snapshot => {
            const fetchedReviews = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setReviews(fetchedReviews);
        }, error => {
            console.error("Error fetching reviews:", error);
        });
        return () => unsubscribe();
    }, [db, selectedListing]);

    // Filter listings based on search criteria
    const filteredListings = listings.filter(listing => {
        const matchesCollege = searchCollege ? listing.location.toLowerCase().includes(searchCollege.toLowerCase()) : true;
        const matchesBudget = searchBudget ? (parseInt(searchBudget.split('-')[1] || searchBudget) >= parseInt(listing.rent) && parseInt(searchBudget.split('-')[0] || 0) <= parseInt(listing.rent)) : true;
        const matchesSafety = searchSafety ? listing.amenities.toLowerCase().includes(searchSafety.toLowerCase()) : true;
        return matchesCollege && matchesBudget && matchesSafety;
    });

    // Check if a listing is new (created within the last 7 days)
    const isNewListing = (timestamp) => {
        if (!timestamp) return false;
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        return timestamp > sevenDaysAgo;
    };

    // Handle viewing listing details
    const handleViewDetails = (listing) => {
        setSelectedListing(listing);
        setShowReviewForm(false);
        setUserRating(0);
        setUserReviewText('');
        setShowDetailsModal(true);
    };

    // Handle WhatsApp contact
    const handleWhatsAppClick = (contact) => {
        const message = encodeURIComponent(`Hi, I’m interested in your room listing: "${selectedListing.title}" on MyRoom app.`);
        window.open(`https://wa.me/${contact}?text=${message}`, '_blank');
    };

    // Handle review submission
    const handleSubmitReview = async () => {
        if (!db || !selectedListing || userRating === 0 || userReviewText.trim() === '') {
            window.alert('Please provide a rating and a review comment.');
            return;
        }
        try {
            const reviewsRef = collection(db, `artifacts/${appId}/public/data/listings/${selectedListing.id}/reviews`);
            await addDoc(reviewsRef, {
                reviewerId: userId,
                rating: userRating,
                comment: userReviewText.trim(),
                timestamp: Date.now()
            });
            window.alert('Review submitted successfully!');
            setUserRating(0);
            setUserReviewText('');
            setShowReviewForm(false);
        } catch (error) {
            console.error("Error submitting review:", error);
            window.alert("Error submitting review.");
        }
    };

    // Calculate average rating for a listing
    const calculateAverageRating = () => {
        if (reviews.length === 0) return 0;
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        return (totalRating / reviews.length).toFixed(1);
    };

    return (
        <div className="w-full flex flex-col items-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 drop-shadow-sm">{text.welcomeStudent}</h2>

            {/* Search Filters */}
            <div className="w-full bg-blue-50 p-6 rounded-xl shadow-inner mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border-2 border-blue-200">
                <input
                    type="text"
                    placeholder={text.collegeName}
                    value={searchCollege}
                    onChange={(e) => setSearchCollege(e.target.value)}
                    className="p-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition duration-200"
                />
                <input
                    type="text"
                    placeholder={text.budget}
                    value={searchBudget}
                    onChange={(e) => setSearchBudget(e.target.value)}
                    className="w-full p-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition duration-200"
                />
                <input
                    type="text"
                    placeholder={text.safety}
                    value={searchSafety}
                    onChange={(e) => setSearchSafety(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition duration-200"
                />
                <button
                    onClick={() => { /* Search logic already handled by filter */ }}
                    className="px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300 transform hover:scale-105 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                >
                    <Search className="mr-2" /> {text.search}
                </button>
            </div>

            {/* Listings Display */}
            {loading ? (
                <p className="text-xl text-gray-600 flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {text.loading}
                </p>
            ) : filteredListings.length === 0 ? (
                <p className="text-xl text-gray-600">{text.noListings}</p>
            ) : (
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredListings.map(listing => (
                        <div key={listing.id} className="bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden relative transform transition duration-300 hover:scale-105 hover:shadow-lg">
                            {isNewListing(listing.timestamp) && (
                                <span className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10 shadow-md">
                                    {text.newLabel}
                                </span>
                            )}
                            <img
                                src={listing.photoUrl || `https://placehold.co/400x250/E0E7FF/4F46E5?text=${text.roomDetails}`}
                                alt={listing.title}
                                className="w-full h-48 object-cover rounded-t-xl"
                                onError={(e) => e.target.src = `https://placehold.co/400x250/E0E7FF/4F46E5?text=${text.roomDetails}`}
                            />
                            <div className="p-4">
                                <h3 className="text-xl font-semibold text-gray-800 mb-2 truncate">{listing.title}</h3>
                                <p className="text-lg text-green-600 font-bold mb-2">₹{listing.rent} / {text.rent.split(' ')[2]}</p>
                                <p className="text-sm text-gray-600 flex items-center mb-1">
                                    <MapPin size={16} className="mr-2 text-blue-500" /> {listing.location}
                                </p>
                                <p className="text-sm text-gray-600 flex items-center mb-3">
                                    <Wrench size={16} className="mr-2 text-yellow-500" /> {listing.amenities}
                                </p>
                                <div className="flex items-center space-x-2 text-sm mb-4">
                                    <span className="flex items-center text-green-700 bg-green-100 px-2 py-1 rounded-full">
                                        <CheckCircle size={14} className="mr-1" /> {text.verifiedOwner}
                                    </span>
                                    <span className="flex items-center text-purple-700 bg-purple-100 px-2 py-1 rounded-full">
                                        <Star size={14} className="mr-1" /> {text.studentPreferred}
                                    </span>
                                </div>
                                <button
                                    onClick={() => handleViewDetails(listing)}
                                    className="w-full px-4 py-2 bg-indigo-500 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-600 transition duration-300 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
                                >
                                    <Eye size={18} className="mr-2" /> {text.roomDetails}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Room Details Modal */}
            {showDetailsModal && selectedListing && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-2xl w-full relative overflow-y-auto max-h-[90vh] border-4 border-purple-200 transform scale-95 animate-scale-in">
                        <button
                            onClick={() => setShowDetailsModal(false)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-3xl font-bold p-1 rounded-full hover:bg-gray-100 transition duration-200"
                        >
                            &times;
                        </button>
                        <h3 className="text-2xl font-bold text-gray-800 mb-4 drop-shadow-sm">{text.roomDetails}</h3>
                        <img
                            src={selectedListing.photoUrl || `https://placehold.co/600x400/E0E7FF/4F46E5?text=${text.roomDetails}`}
                            alt={selectedListing.title}
                            className="w-full h-64 object-cover rounded-lg mb-4 shadow-md"
                            onError={(e) => e.target.src = `https://placehold.co/600x400/E0E7FF/4F46E5?text=${text.roomDetails}`}
                        />
                        <p className="text-xl font-semibold text-gray-900 mb-2">{selectedListing.title}</p>
                        {selectedListing.description && (
                            <p className="text-md text-gray-700 mb-2 italic">
                                <span className="font-semibold">{text.description}:</span> {selectedListing.description}
                            </p>
                        )}
                        <p className="text-lg text-green-600 font-bold mb-3">₹{selectedListing.rent} / {text.rent.split(' ')[2]}</p>
                        <p className="text-md text-gray-700 mb-2 flex items-center">
                            <MapPin size={20} className="mr-2 text-blue-500" /> <span className="font-semibold">{text.address}:</span> {selectedListing.location}
                        </p>
                        <p className="text-md text-gray-700 mb-4 flex items-center">
                            <Wrench size={20} className="mr-2 text-yellow-500" /> <span className="font-semibold">{text.amenities}:</span> {selectedListing.amenities}
                        </p>

                        <h4 className="text-xl font-semibold text-gray-800 mb-3 flex items-center mt-6">
                            <MapPin size={20} className="mr-2 text-purple-600" /> {text.viewOnMap}
                        </h4>
                        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedListing.location)}`} target="_blank" rel="noopener noreferrer" className="w-full">
                            <img
                                src={`https://placehold.co/600x300/E0E7FF/4F46E5?text=Map+of+${encodeURIComponent(selectedListing.location)}`}
                                alt={`Map of ${selectedListing.location}`}
                                className="w-full h-48 object-cover rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                            />
                        </a>

                        <h4 className="text-xl font-semibold text-gray-800 mb-3 flex items-center mt-6">
                            <Phone size={20} className="mr-2 text-purple-600" /> {text.ownerContact}
                        </h4>
                        <div className="flex flex-wrap gap-3">
                            {selectedListing.contactInfo.split(',').map((contact, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleWhatsAppClick(contact.trim())}
                                    className="px-6 py-3 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 transition duration-300 flex items-center focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
                                >
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" className="w-5 h-5 mr-2" />
                                    {contact.trim()}
                                </button>
                            ))}
                        </div>

                        <h4 className="text-xl font-semibold text-gray-800 mb-3 flex items-center mt-6">
                            <Star size={20} className="mr-2 text-yellow-500" /> {text.reviews}
                            {reviews.length > 0 && <span className="ml-2 text-lg text-gray-600">({text.averageRating}: {calculateAverageRating()})</span>}
                        </h4>
                        {reviews.length === 0 ? (
                            <p className="text-gray-600">{text.noReviews}</p>
                        ) : (
                            <div className="w-full space-y-4">
                                {reviews.map(review => (
                                    <div key={review.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                                        <div className="flex items-center mb-2">
                                            <StarRating rating={review.rating} setRating={() => {}} size={18} />
                                            <span className="ml-3 text-sm font-semibold text-gray-700">User ID: {review.reviewerId ? review.reviewerId.substring(0, 8) + '...' : 'N/A'}</span>
                                            <span className="ml-auto text-xs text-gray-500">{review.timestamp ? new Date(review.timestamp).toLocaleDateString() : 'N/A'}</span>
                                        </div>
                                        <p className="text-gray-700">{review.comment}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                        <button
                            onClick={() => setShowReviewForm(!showReviewForm)}
                            className="w-full px-6 py-3 mt-4 bg-blue-500 text-white font-semibold rounded-xl shadow-md hover:bg-blue-600 transition duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 flex items-center justify-center"
                        >
                            <PlusCircle size={20} className="mr-2" /> {text.addReview}
                        </button>
                        {showReviewForm && (
                            <div className="mt-4 w-full bg-blue-50 p-4 rounded-lg border border-blue-200 shadow-inner">
                                <h5 className="font-semibold text-gray-800 mb-3">{text.rateThisListing}</h5>
                                <div className="mb-3">
                                    <span className="font-medium text-gray-700 mr-2">{text.yourRating}</span>
                                    <StarRating rating={userRating} setRating={setUserRating} size={24} />
                                </div>
                                <textarea
                                    placeholder={text.yourReview}
                                    value={userReviewText}
                                    onChange={(e) => setUserReviewText(e.target.value)}
                                    rows="3"
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition duration-200"
                                ></textarea>
                                <button
                                    onClick={handleSubmitReview}
                                    className="w-full px-4 py-2 mt-3 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 transition duration-300 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
                                >
                                    {text.submitReview}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// Owner Dashboard component
function OwnerDashboard({ text, userId, db, storage }) {
    const [showAddForm, setShowAddForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [currentEditListing, setCurrentEditListing] = useState(null);
    const [ownerListings, setOwnerListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState('');
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [showReviewsModal, setShowReviewsModal] = useState(false);
    const [currentListingReviews, setCurrentListingReviews] = useState([]);

    const [listingData, setListingData] = useState({
        title: '',
        rent: '',
        amenities: '',
        contactInfo: '',
        location: '',
        photoUrl: '',
        description: '',
        ownerId: userId,
        isBooked: false,
        timestamp: null,
        status: 'pending', // New field for moderation status
    });

    // Fetch owner's listings from Firestore
    useEffect(() => {
        if (!db || !userId) return;

        const collectionRef = collection(db, `artifacts/${appId}/users/${userId}/ownerListings`);
        const q = query(collectionRef, where("ownerId", "==", userId));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedListings = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setOwnerListings(fetchedListings);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching owner listings:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [db, userId]);

    // Clear image preview and data on form close
    useEffect(() => {
        if (!showAddForm && !showEditForm && imagePreviewUrl) {
            URL.revokeObjectURL(imagePreviewUrl);
            setImagePreviewUrl('');
            setSelectedImage(null);
        }
    }, [showAddForm, showEditForm, imagePreviewUrl]);

    // Handle form input changes
    const handleChange = (e) => {
        setListingData({ ...listingData, [e.target.name]: e.target.value });
    };

    // Handle image file selection
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedImage(file);
            setImagePreviewUrl(URL.createObjectURL(file));
        } else {
            setSelectedImage(null);
            setImagePreviewUrl('');
        }
    };

    // Upload image to Firebase Storage
    const uploadImage = async () => {
        if (!selectedImage || !storage) return '';

        setIsUploadingImage(true);
        try {
            const storageRef = ref(storage, `room_images/${userId}/${selectedImage.name}_${Date.now()}`);
            await uploadBytes(storageRef, selectedImage);
            const url = await getDownloadURL(storageRef);
            window.alert(text.imageUploadSuccess);
            return url;
        } catch (error) {
            console.error("Error uploading image:", error);
            window.alert(text.imageUploadError);
            return '';
        } finally {
            setIsUploadingImage(false);
        }
    };

    // Handle adding a new listing
    const handleAddSubmit = async (e) => {
        e.preventDefault();
        if (!db) {
            console.error("Firestore DB is not initialized.");
            return;
        }

        let imageUrl = listingData.photoUrl;
        if (selectedImage) {
            imageUrl = await uploadImage();
            if (!imageUrl) return;
        }

        try {
            const newListingData = { ...listingData, photoUrl: imageUrl, timestamp: Date.now(), status: 'pending' };

            const ownerListingRef = await addDoc(collection(db, `artifacts/${appId}/users/${userId}/ownerListings`), newListingData);
            await setDoc(doc(db, `artifacts/${appId}/public/data/listings`, ownerListingRef.id), newListingData);

            window.alert(text.listingSuccess);
            setListingData({
                title: '', rent: '', amenities: '', contactInfo: '',
                location: '', photoUrl: '', description: '', ownerId: userId, isBooked: false, timestamp: null, status: 'pending',
            });
            setSelectedImage(null);
            setImagePreviewUrl('');
            setShowAddForm(false);
        } catch (e) {
            console.error("Error adding document: ", e);
            window.alert(text.listingError);
        }
    };

    // Handle updating an existing listing
    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        if (!db || !currentEditListing) {
            console.error("Firestore DB or currentEditListing is not initialized.");
            return;
        }

        let imageUrl = listingData.photoUrl;
        if (selectedImage) {
            imageUrl = await uploadImage();
            if (!imageUrl) return;
        }

        try {
            const updatedListingData = { ...listingData, photoUrl: imageUrl };

            const ownerDocRef = doc(db, `artifacts/${appId}/users/${userId}/ownerListings`, currentEditListing.id);
            await updateDoc(ownerDocRef, updatedListingData);

            const publicDocRef = doc(db, `artifacts/${appId}/public/data/listings`, currentEditListing.id);
            await updateDoc(publicDocRef, updatedListingData);

            window.alert("Listing updated successfully!");
            setShowEditForm(false);
            setCurrentEditListing(null);
            setListingData({
                title: '', rent: '', amenities: '', contactInfo: '',
                location: '', photoUrl: '', description: '', ownerId: userId, isBooked: false, timestamp: null, status: 'pending',
            });
            setSelectedImage(null);
            setImagePreviewUrl('');
        } catch (e) {
            console.error("Error updating document: ", e);
            window.alert("Error updating listing.");
        }
    };

    // Handle deleting a listing
    const handleDeleteListing = async (listingId) => {
        if (!db || !userId) return;

        const confirmed = window.confirm(text.deleteConfirm);

        if (confirmed) {
            try {
                await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/ownerListings`, listingId));
                await deleteDoc(doc(db, `artifacts/${appId}/public/data/listings`, listingId));
                window.alert("Listing deleted successfully!");
            } catch (error) {
                console.error("Error deleting listing:", error);
                window.alert("Error deleting listing.");
            }
        }
    };

    // Handle marking a listing as booked
    const handleMarkAsBooked = async (listingId) => {
        if (!db || !userId) return;

        try {
            const ownerDocRef = doc(db, `artifacts/${appId}/users/${userId}/ownerListings`, listingId);
            await updateDoc(ownerDocRef, { isBooked: true });

            const publicDocRef = doc(db, `artifacts/${appId}/public/data/listings`, listingId);
            await updateDoc(publicDocRef, { isBooked: true });

            window.alert("Listing marked as booked!");
        } catch (error) {
            console.error("Error marking listing as booked:", error);
            window.alert("Error marking listing as booked.");
        }
    };

    // Set data for editing a listing
    const handleEditListing = (listing) => {
        setCurrentEditListing(listing);
        setListingData({
            title: listing.title,
            rent: listing.rent,
            amenities: listing.amenities,
            contactInfo: listing.contactInfo,
            location: listing.location,
            photoUrl: listing.photoUrl,
            description: listing.description || '',
            ownerId: userId,
            isBooked: listing.isBooked,
            timestamp: listing.timestamp || null,
            status: listing.status || 'pending',
        });
        setImagePreviewUrl(listing.photoUrl || '');
        setSelectedImage(null);
        setShowEditForm(true);
    };

    // Handle viewing reviews for a listing
    const handleViewReviews = async (listing) => {
        if (!db) return;
        try {
            const reviewsRef = collection(db, `artifacts/${appId}/public/data/listings/${listing.id}/reviews`);
            const snapshot = await getDocs(reviewsRef);
            const fetchedReviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCurrentListingReviews(fetchedReviews);
            setShowReviewsModal(true);
        } catch (error) {
            console.error("Error fetching reviews for owner:", error);
            window.alert("Error fetching reviews.");
        }
    };

    return (
        <div className="w-full flex flex-col items-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 drop-shadow-sm">{text.welcomeOwner}</h2>

            <div className="flex flex-wrap gap-4 mb-8 justify-center">
                <button
                    onClick={() => { setShowAddForm(true); }}
                    className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl shadow-lg hover:bg-purple-700 transition duration-300 transform hover:scale-105 flex items-center focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2"
                >
                    <PlusCircle className="mr-2" /> {text.addListing}
                </button>
                <button
                    onClick={() => { setShowAddForm(false); setShowEditForm(false); }}
                    className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl shadow-lg hover:bg-blue-700 transition duration-300 transform hover:scale-105 flex items-center focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                >
                    <Building2 className="mr-2" /> {text.myListings}
                </button>
            </div>

            {/* Add/Edit Listing Form Modal */}
            {(showAddForm || showEditForm) && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full relative overflow-y-auto max-h-[90vh] border-4 border-teal-200 transform scale-95 animate-scale-in">
                        <button
                            onClick={() => { setShowAddForm(false); setShowEditForm(false); setListingData({ title: '', rent: '', amenities: '', contactInfo: '', location: '', photoUrl: '', description: '', ownerId: userId, isBooked: false, timestamp: null, status: 'pending' }); setSelectedImage(null); setImagePreviewUrl(''); }}
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-3xl font-bold p-1 rounded-full hover:bg-gray-100 transition duration-200"
                        >
                            &times;
                        </button>
                        <h3 className="text-2xl font-bold text-gray-800 mb-6 drop-shadow-sm">{showAddForm ? text.addListing : text.editListing}</h3>
                        <form onSubmit={showAddForm ? handleAddSubmit : handleUpdateSubmit} className="space-y-4">
                            <input
                                type="text"
                                name="title"
                                placeholder={text.roomTitle}
                                value={listingData.title}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition duration-200"
                                required
                            />
                            <input
                                type="number"
                                name="rent"
                                placeholder={text.rent}
                                value={listingData.rent}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition duration-200"
                                required
                            />
                            <input
                                type="text"
                                name="amenities"
                                placeholder={text.amenities}
                                value={listingData.amenities}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition duration-200"
                                required
                            />
                            <input
                                type="text"
                                name="contactInfo"
                                placeholder={text.contactInfo}
                                value={listingData.contactInfo}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition duration-200"
                                required
                            />
                            <input
                                type="text"
                                name="location"
                                placeholder={text.location}
                                value={listingData.location}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition duration-200"
                                required
                            />

                            {/* Image Upload Field */}
                            <div className="flex flex-col items-center p-3 border border-gray-300 rounded-lg hover:border-blue-400 transition duration-200 cursor-pointer">
                                <label htmlFor="photoUpload" className="flex items-center justify-center w-full cursor-pointer text-blue-600 font-semibold">
                                    <ImageIcon size={20} className="mr-2" /> {text.selectImage}
                                </label>
                                <input
                                    type="file"
                                    id="photoUpload"
                                    name="photoUpload"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                                {imagePreviewUrl && (
                                    <div className="mt-4 w-32 h-32 rounded-lg overflow-hidden border border-gray-200 shadow-md">
                                        <img src={imagePreviewUrl} alt="Image Preview" className="w-full h-full object-cover" />
                                    </div>
                                )}
                                {(selectedImage || listingData.photoUrl) && (
                                    <p className="mt-2 text-sm text-gray-500 truncate w-full text-center">
                                        {selectedImage ? selectedImage.name : listingData.photoUrl.split('/').pop().split('?')[0]}
                                    </p>
                                )}
                                {isUploadingImage && (
                                    <p className="mt-2 text-sm text-blue-500 flex items-center">
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        {text.uploadingImage}
                                    </p>
                                )}
                            </div>

                            <textarea
                                name="description"
                                placeholder={text.description}
                                value={listingData.description}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition duration-200 min-h-[100px]"
                                rows="4"
                            ></textarea>
                           
                            <button
                                type="submit"
                                disabled={isUploadingImage}
                                className={`w-full px-6 py-3 text-white font-semibold rounded-xl shadow-md transition duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                    isUploadingImage ? 'bg-gray-400 cursor-not-allowed' : (showAddForm ? 'bg-green-500 hover:bg-green-600 focus:ring-green-400' : 'bg-indigo-500 hover:bg-indigo-600 focus:ring-indigo-400')
                                }`}
                            >
                                {isUploadingImage ? text.uploadingImage : (showAddForm ? text.submitListing : text.updateListing)}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Owner's Listings Display */}
            <div className="w-full">
                <h3 className="text-2xl font-bold text-gray-800 mb-4 drop-shadow-sm">{text.myListings}</h3>
                {loading ? (
                    <p className="text-xl text-gray-600 flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {text.loading}
                    </p>
                ) : ownerListings.length === 0 ? (
                    <p className="text-xl text-gray-600">{text.noOwnerListings}</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {ownerListings.map(listing => (
                            <div key={listing.id} className="bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden flex flex-col md:flex-row transform transition duration-300 hover:scale-[1.02] hover:shadow-lg">
                                <img
                                    src={listing.photoUrl || `https://placehold.co/200x150/E0E7FF/4F46E5?text=${text.roomDetails}`}
                                    alt={listing.title}
                                    className="w-full md:w-1/3 h-48 md:h-auto object-cover rounded-t-xl md:rounded-l-xl md:rounded-tr-none shadow-sm"
                                    onError={(e) => e.target.src = `https://placehold.co/200x150/E0E7FF/4F46E5?text=${text.roomDetails}`}
                                />
                                <div className="p-4 flex-grow flex flex-col justify-between">
                                    <div>
                                        <h4 className="text-xl font-semibold text-gray-800 mb-1">{listing.title}</h4>
                                        {listing.description && (
                                            <p className="text-sm text-gray-600 mb-2 italic">{listing.description}</p>
                                        )}
                                        <p className="text-lg text-green-600 font-bold mb-2">₹{listing.rent} / {text.rent.split(' ')[2]}</p>
                                        <p className="text-sm text-gray-600 flex items-center mb-1">
                                            <MapPin size={16} className="mr-2 text-blue-500" /> {listing.location}
                                        </p>
                                        <p className="text-sm text-gray-600 flex items-center mb-2">
                                            <Wrench size={16} className="mr-2 text-yellow-500" /> {listing.amenities}
                                        </p>
                                        <p className="text-sm text-gray-600 flex items-center mb-3">
                                            <Phone size={16} className="mr-2 text-red-500" /> {listing.contactInfo}
                                        </p>
                                        {listing.isBooked && (
                                            <span className="inline-flex items-center bg-gray-200 text-gray-700 text-xs font-semibold px-2.5 py-0.5 rounded-full mb-3">
                                                <CircleDot size={12} className="mr-1" /> Booked
                                            </span>
                                        )}
                                        <p className={`text-sm font-semibold mt-2 ${listing.status === 'approved' ? 'text-green-600' : listing.status === 'rejected' ? 'text-red-600' : 'text-yellow-600'}`}>
                                            Status: {listing.status ? text[listing.status] : text.pending}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {!listing.isBooked && (
                                            <button
                                                onClick={() => handleMarkAsBooked(listing.id)}
                                                className="px-4 py-2 bg-yellow-500 text-white font-semibold rounded-lg shadow-md hover:bg-yellow-600 transition duration-300 text-sm flex items-center focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2"
                                            >
                                                <CheckCircle size={16} className="mr-1" /> {text.markAsBooked}
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleEditListing(listing)}
                                            className="px-4 py-2 bg-indigo-500 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-600 transition duration-300 text-sm flex items-center focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
                                        >
                                            <Wrench size={16} className="mr-1" /> {text.editListing}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteListing(listing.id)}
                                            className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg shadow-md hover:bg-red-600 transition duration-300 text-sm flex items-center focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
                                        >
                                            <Trash2 size={16} className="mr-1" /> {text.deleteListing}
                                        </button>
                                        <button
                                            onClick={() => handleViewReviews(listing)}
                                            className="px-4 py-2 bg-gray-500 text-white font-semibold rounded-lg shadow-md hover:bg-gray-600 transition duration-300 text-sm flex items-center focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                                        >
                                            <Star size={16} className="mr-1" /> {text.reviews}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {/* Reviews Modal for Owners */}
            {showReviewsModal && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-2xl w-full relative overflow-y-auto max-h-[90vh] border-4 border-purple-200 transform scale-95 animate-scale-in">
                        <button
                            onClick={() => setShowReviewsModal(false)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-3xl font-bold p-1 rounded-full hover:bg-gray-100 transition duration-200"
                        >
                            &times;
                        </button>
                        <h3 className="text-2xl font-bold text-gray-800 mb-4 drop-shadow-sm">{text.reviews}</h3>
                        {currentListingReviews.length === 0 ? (
                            <p className="text-gray-600">{text.noReviews}</p>
                        ) : (
                            <div className="w-full space-y-4">
                                {currentListingReviews.map(review => (
                                    <div key={review.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                                        <div className="flex items-center mb-2">
                                            <StarRating rating={review.rating} setRating={() => {}} size={18} />
                                            <span className="ml-3 text-sm font-semibold text-gray-700">User ID: {review.reviewerId.substring(0, 8)}...</span>
                                            <span className="ml-auto text-xs text-gray-500">{new Date(review.timestamp).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-gray-700">{review.comment}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// Admin Dashboard component
function AdminDashboard({ text, userId, db }) {
    const [allListings, setAllListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'pending', 'approved', 'rejected'

    // Fetch all listings for admin view
    useEffect(() => {
        if (!db) return;

        const listingsRef = collection(db, `artifacts/${appId}/public/data/listings`);
        let q = listingsRef;

        if (filterStatus !== 'all') {
            q = query(listingsRef, where("status", "==", filterStatus));
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedListings = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setAllListings(fetchedListings);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching all listings for admin:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [db, filterStatus]);

    // Handle updating listing status (approve/reject)
    const handleUpdateListingStatus = async (listingId, newStatus, ownerId, listingTitle) => {
        if (!db) return;
        try {
            const publicDocRef = doc(db, `artifacts/${appId}/public/data/listings`, listingId);
            await updateDoc(publicDocRef, { status: newStatus });

            // Also update the owner's private listing
            const ownerDocRef = doc(db, `artifacts/${appId}/users/${ownerId}/ownerListings`, listingId);
            await updateDoc(ownerDocRef, { status: newStatus });

            window.alert(`Listing ${listingId} status updated to ${newStatus}!`);
        } catch (error) {
            console.error("Error updating listing status:", error);
            window.alert("Error updating listing status.");
        }
    };

    // Calculate listing statistics
    const totalListings = allListings.length;
    const pendingListings = allListings.filter(l => l.status === 'pending').length;
    const approvedListings = allListings.filter(l => l.status === 'approved').length;
    const rejectedListings = allListings.filter(l => l.status === 'rejected').length;

    return (
        <div className="w-full flex flex-col items-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 drop-shadow-sm">{text.admin} Dashboard</h2>
            <p className="text-lg text-gray-600 mb-4 text-center">
                {text.userId} <span className="font-mono text-sm break-all">{userId}</span>
            </p>

            {/* Listing Statistics and Filters */}
            <div className="bg-blue-50 p-6 rounded-xl shadow-inner mb-8 w-full border-2 border-blue-200">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Listing Statistics</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    <div className="p-3 bg-gray-100 rounded-lg shadow-sm">
                        <p className="text-sm text-gray-600">Total Listings</p>
                        <p className="text-2xl font-bold text-gray-800">{totalListings}</p>
                    </div>
                    <div className="p-3 bg-yellow-100 rounded-lg shadow-sm">
                        <p className="text-sm text-yellow-800">Pending</p>
                        <p className="text-2xl font-bold text-yellow-800">{pendingListings}</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-lg shadow-sm">
                        <p className="text-sm text-green-800">Approved</p>
                        <p className="text-2xl font-bold text-green-800">{approvedListings}</p>
                    </div>
                    <div className="p-3 bg-red-100 rounded-lg shadow-sm">
                        <p className="text-sm text-red-800">Rejected</p>
                        <p className="text-2xl font-bold text-red-800">{rejectedListings}</p>
                    </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3 justify-center">
                    <button
                        onClick={() => setFilterStatus('all')}
                        className={`px-4 py-2 rounded-lg font-semibold transition duration-200 ${filterStatus === 'all' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilterStatus('pending')}
                        className={`px-4 py-2 rounded-lg font-semibold transition duration-200 ${filterStatus === 'pending' ? 'bg-yellow-600 text-white shadow-md' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'}`}
                    >
                        {text.pending}
                    </button>
                    <button
                        onClick={() => setFilterStatus('approved')}
                        className={`px-4 py-2 rounded-lg font-semibold transition duration-200 ${filterStatus === 'approved' ? 'bg-green-600 text-white shadow-md' : 'bg-green-100 text-green-800 hover:bg-green-200'}`}
                    >
                        {text.approved}
                    </button>
                    <button
                        onClick={() => setFilterStatus('rejected')}
                        className={`px-4 py-2 rounded-lg font-semibold transition duration-200 ${filterStatus === 'rejected' ? 'bg-red-600 text-white shadow-md' : 'bg-red-100 text-red-800 hover:bg-red-200'}`}
                    >
                        {text.rejected}
                    </button>
                </div>
            </div>

            {/* Manage Listings Section */}
            <h3 className="text-2xl font-bold text-gray-800 mb-4 drop-shadow-sm">Manage Listings</h3>
            {loading ? (
                <p className="text-xl text-gray-600 flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    {text.loading}
                </p>
            ) : allListings.length === 0 ? (
                <p className="text-xl text-gray-600">No listings to manage.</p>
            ) : (
                <div className="w-full grid grid-cols-1 gap-6">
                    {allListings.map(listing => (
                        <div key={listing.id} className="bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden flex flex-col sm:flex-row transform transition duration-300 hover:scale-[1.01] hover:shadow-lg">
                            <img
                                src={listing.photoUrl || `https://placehold.co/150x100/E0E7FF/4F46E5?text=Room`}
                                alt={listing.title}
                                className="w-full sm:w-48 h-36 object-cover rounded-t-xl sm:rounded-l-xl sm:rounded-tr-none shadow-sm"
                                onError={(e) => e.target.src = `https://placehold.co/150x100/E0E7FF/4F46E5?text=Room`}
                            />
                            <div className="p-4 flex-grow flex flex-col justify-between">
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-800 mb-1">{listing.title}</h4>
                                    <p className="text-sm text-gray-600 mb-1">Owner ID: <span className="font-mono break-all">{listing.ownerId}</span></p>
                                    <p className="text-sm text-gray-600 mb-1">Location: {listing.location}</p>
                                    <p className="text-sm text-gray-600 mb-2">Rent: ₹{listing.rent}</p>
                                    <p className={`text-md font-bold ${listing.status === 'approved' ? 'text-green-600' : listing.status === 'rejected' ? 'text-red-600' : 'text-yellow-600'}`}>
                                        Status: {listing.status ? text[listing.status] : text.pending}
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {listing.status !== 'approved' && (
                                        <button
                                            onClick={() => handleUpdateListingStatus(listing.id, 'approved', listing.ownerId, listing.title)}
                                            className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 transition duration-300 text-sm flex items-center focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
                                        >
                                            {text.approve}
                                        </button>
                                    )}
                                    {listing.status !== 'rejected' && (
                                        <button
                                            onClick={() => handleUpdateListingStatus(listing.id, 'rejected', listing.ownerId, listing.title)}
                                            className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg shadow-md hover:bg-red-600 transition duration-300 text-sm flex items-center focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
                                        >
                                            {text.reject}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// Root component that wraps the App with FirebaseProvider
export default function Root() {
    return (
        <FirebaseProvider>
            <App />
        </FirebaseProvider>
    );
}
