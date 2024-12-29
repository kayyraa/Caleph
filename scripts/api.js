import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-analytics.js";
import * as Firestore from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

export const FirebaseConfig = {
    apiKey: "AIzaSyBCrtfPiMB21UXLv_539XpDRxy1BDz0pak",
    authDomain: "caleph-25300.firebaseapp.com",
    projectId: "caleph-25300",
    storageBucket: "caleph-25300.firebasestorage.app",
    messagingSenderId: "271875429154",
    appId: "1:271875429154:web:95d46338ad453e959fcb7b",
    measurementId: "G-WHYVJEX1RV"
};

export const GithubStorageConfig = {
    Token: "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",
    StorageOwner: "kayyraa",
    StorageName: "DirectStorage"
};

export const App = initializeApp(FirebaseConfig);
export const Analytics = getAnalytics(App);
export const Db = Firestore.getFirestore(App);

export class GithubStorage {
    constructor(Document = undefined || new File) {
        this.Path = Document;
    }

    async Remove() {
        if (!this.Path) return;
        const Url = `https://api.github.com/repos/${GithubStorageConfig.StorageOwner}/${GithubStorageConfig.StorageName}/contents/${Document.name}`;
        const Response = await axios.delete(Url, {
            headers: {
                Authorization: `Bearer ${GithubStorageConfig.Token}`,
                Accept: "application/vnd.github+json"
            }
        });
        return Response.data.content.html_url;
    }

    async Upload() {
        if (!this.Path) return;
    
        const FileContent = await this.ReadFileAsBase64(this.Path);
        const Url = `https://api.github.com/repos/${GithubStorageConfig.StorageOwner}/${GithubStorageConfig.StorageName}/contents/${this.Path.name}`;
    
        await axios.put(Url, {
            message: `Upload ${this.Path.name}`,
            content: FileContent
        }, {
            headers: {
                Authorization: `Bearer ${GithubStorageConfig.Token}`,
                Accept: "application/vnd.github+json"
            }
        });
    }
    
    
    async ReadFileAsBase64(File) {
        return new Promise((Resolve, Reject) => {
            const Reader = new FileReader();
            Reader.onload = () => Resolve(btoa(Reader.result));
            Reader.onerror = () => Reject(new Error("Failed to read file"));
            Reader.readAsBinaryString(File);
        });
    }    
}

export class Storage {
    constructor(Collection = "") {
        this.Collection = Collection;
    }

    async AppendDocument(DocumentData) {
        if (!this.Collection) return;
        const DocRef = await Firestore.addDoc(Firestore.collection(Db, this.Collection), DocumentData);
        return DocRef.id;
    }

    async GetDocument(DocumentId) {
        if (!this.Collection) return;
        const DocRef = Firestore.doc(Db, this.Collection, DocumentId);
        const Snapshot = await Firestore.getDoc(DocRef);
        
        if (Snapshot.exists()) return { id: Snapshot.id, ...Snapshot.data() };
        else return null;
    }    

    async UpdateDocument(DocumentId, DocumentData) {
        if (!this.Collection) return;
        const DocRef = Firestore.doc(Db, this.Collection, DocumentId);
        await Firestore.updateDoc(DocRef, DocumentData);
    }

    async DeleteDocument(DocumentId) {
        if (!this.Collection) return;
        const DocRef = Firestore.doc(Db, this.Collection, DocumentId);
        await Firestore.deleteDoc(DocRef);
    }

    async GetDocuments(Query = {}) {
        if (!this.Collection) return;
        const CollectionRef = Firestore.collection(Db, this.Collection);
        let QueryRef = CollectionRef;
        Object.entries(Query).forEach(([Key, Value]) => {
            QueryRef = Firestore.query(QueryRef, Firestore.where(Key, "==", Value));
        });
        const QuerySnapshot = await Firestore.getDocs(QueryRef);
        return QuerySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async GetDocumentsByField(FieldName, FieldValue) {
        if (!this.Collection) return;
        const QueryRef = Firestore.query(
            Firestore.collection(Db, this.Collection),
            Firestore.where(FieldName, "==", FieldValue)
        );
        const QuerySnapshot = await Firestore.getDocs(QueryRef);
        return QuerySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async GetDocumentByFieldIncludes(FieldName, FieldValue) {
        if (!this.Collection) return;
        const QueryRef = Firestore.query(
            Firestore.collection(Db, this.Collection),
            Firestore.where(FieldName, ">=", FieldValue)
        );
        const QuerySnapshot = await Firestore.getDocs(QueryRef);
        return QuerySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    }
}