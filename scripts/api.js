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
    Token: "",
    StorageOwner: "kayyraa",
    StorageName: "DirectStorage"
};

export const App = initializeApp(FirebaseConfig);
export const Analytics = getAnalytics(App);
export const Db = Firestore.getFirestore(App);

export const Admins = ["kayra"];

export class GithubStorage {
    constructor(Document = undefined || new File) {
        this.File = Document;
    }

    async Upload(Path = undefined || "") {
        const FileContent = await this.ReadFileAsBase64(this.File);
    
        const Url = `https://api.github.com/repos/${GithubStorageConfig.StorageOwner}/${GithubStorageConfig.StorageName}/contents/${Path}`;
        const Data = {
            message: "Upload file to repo",
            content: FileContent
        };
    
        const Response = await fetch(Url, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${GithubStorageConfig.Token}`,
                "Accept": "application/vnd.github.v3+json"
            },
            body: JSON.stringify(Data)
        });
    
        const Result = await Response.json();
        if (Response.ok) {
            console.log("File uploaded:", Result.content.html_url);
        } else {
            console.error("Upload failed:", Result);
        }
    }
    
    async ReadFileAsBase64(File) {
        return new Promise((Resolve, Reject) => {
            const Reader = new FileReader();
            Reader.onload = () => Resolve(Reader.result.split(",")[1]);
            Reader.onerror = Reject;
            Reader.readAsDataURL(File);
        });
    }
    
    async Download() {
        const Path = this.File.name;
        const Url = `https://api.github.com/repos/${GithubStorageConfig.StorageOwner}/${GithubStorageConfig.StorageName}/contents/${Path}`;
        
        const Response = await fetch(Url, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${GithubStorageConfig.Token}`,
                "Accept": "application/vnd.github.v3+json"
            }
        });

        const Result = await Response.json();
        if (Response.ok) {
            const FileContent = atob(Result.content);
            console.log("File retrieved:", FileContent);
            return FileContent;
        } else {
            console.error("Failed to fetch file:", Result);
            throw new Error("File fetch failed");
        }
    }

    async Remove() {
        const Path = this.File.name;
        const Url = `https://api.github.com/repos/${GithubStorageConfig.StorageOwner}/${GithubStorageConfig.StorageName}/contents/${Path}`;

        const Response = await fetch(Url, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${GithubStorageConfig.Token}`,
                "Accept": "application/vnd.github.v3+json"
            }
        });

        const Result = await Response.json();
        if (Response.ok) {
            const Sha = Result.sha;

            const DeleteResponse = await fetch(Url, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${GithubStorageConfig.Token}`,
                    "Accept": "application/vnd.github.v3+json"
                },
                body: JSON.stringify({
                    message: "Remove file from repo",
                    sha: Sha
                })
            });

            const DeleteResult = await DeleteResponse.json();
            if (DeleteResponse.ok) {
                console.log("File removed successfully:", DeleteResult);
            } else {
                console.error("Remove failed:", DeleteResult);
            }
        } else {
            console.error("Failed to fetch file for removal:", Result);
        }
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

await new Storage("Users").GetDocument("Secrets").then((Secrets) => {
    GithubStorageConfig.Token = Secrets.Token;
});