import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-analytics.js";
import * as Firestore from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import * as Hud from "./hud.js";

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

export const ArticleStorage = new Storage("Articles")
export class Article {
    constructor(Id = "", Name = "", Content = "", Author = "", Search = "") {
        this.Id = Id;
        this.Name = Name;
        this.Content = Content;
        this.Author = Author;
        this.Search = Search;
    }

    Show() {
        Hud.ArticleContent.querySelector(".Content").innerHTML = "";
        Hud.ArticleContent.style.display = "initial";
        Hud.ArticleContent.querySelector("header").textContent = this.Name;
        FormatContent(this.Content);

        if (this.Author === JSON.parse(localStorage.getItem("User")).Username) {
            Hud.ArticleContent.querySelector(".Bottombar").style.display = "";
            Hud.ArticleContent.querySelector(".Bottombar").querySelector(".Delete").addEventListener("click", async () => {
                await Hud.ArticleStorage.DeleteDocument(Article.id);
                location.reload();
            });

            Hud.ArticleContent.querySelector(".Bottombar").querySelector(".Edit").addEventListener("click", () => {
                Hud.ArticleWizard.style.display = "initial";
                Hud.ArticleWizard.querySelectorAll("input.ArticleTitleInput")[0].value = Article.Name;
                Hud.ArticleWizard.querySelectorAll("textarea.ArticleContentInput")[0].value = Article.Content;
                Hud.SetEditing(true);
            })

            Hud.ArticleWizard.querySelectorAll("button.PublishArticleButton")[0].addEventListener("click", async () => {
                const ArticleName = Hud.ArticleWizard.querySelectorAll("input.ArticleTitleInput")[0].value;
                const ArticleContent = Hud.ArticleWizard.querySelectorAll("textarea.ArticleContentInput")[0].value;
                if (!ArticleName || !ArticleContent) return;
                if (!this.Id) return

                const UpdatedArticle = {
                    Name: ArticleName,
                    Content: ArticleContent,
                    Author: JSON.parse(localStorage.getItem("User")).Username
                }

                await ArticleStorage.UpdateDocument(this.Id, UpdatedArticle);
                location.reload();
            });
        } else if (!Admins.includes(JSON.parse(localStorage.getItem("User")).Username)) Hud.ArticleContent.querySelector(".Bottombar").style.display = "none";
    }
}

await new Storage("Users").GetDocument("Secrets").then((Secrets) => {
    GithubStorageConfig.Token = Secrets.Token;
});

export function FormatContent(Content = "") {
    Content.split(" ").forEach(Word => {
        Word = String(Word)

        let Element = {
            Type: "span",
            Size: "1em",
            Properties: []
        }

        if (Word.startsWith("-")) {
            Element.Type = "li";
        } else if (Word.startsWith("#")) {
            Element.Type = "header";
            Element.Size = "2em";
            Word = Word.replace("#", "");
        } else if (Word.startsWith("<b>") && Word.endsWith("</b>")) {
            Element.Type = "b";
            Word = Word.replace("<b>", "").replace("</b>", "").trim();
        } else if (Word.startsWith("<img>") && Word.endsWith("</img>")) {
            Element.Type = "img";
            Element.Properties.push([
                "src",
                Word.replace("<img>", "").replace("</img>", "").trim()
            ]);
            Word = "";
        } else if (Word.startsWith("<video>") && Word.endsWith("</video>")) {
            Element.Type = "video";
            Element.Properties.push([
                "controls",
                "true"
            ]);
            Element.Properties.push([
                "src",
                Word.replace("<video>", "").replace("</video>", "").trim()
            ]);
            Word = "";
        }

        const WordElement = document.createElement(Element.Type);
        WordElement.textContent = Word;
        WordElement.style.setProperty("--Size", Element.Size);
        Hud.ArticleContent.querySelector(".Content").appendChild(WordElement)

        Element.Properties.forEach(Property => {
            WordElement.setAttribute(Property[0], Property[1]);
        })

        if (Word.startsWith("[") && Word.endsWith("]") && Word.includes(",")) {
            console.log(Word);
            ArticleStorage.GetDocumentsByField("Name", String(Word.replace("[", "").replace("]", "").split(",")[1].replace("-", " "))).then((FoundArticle) => {
                FoundArticle = FoundArticle[0];
                if (!FoundArticle) return

                WordElement.setAttribute("href", FoundArticle.id);
                WordElement.innerHTML = Word.replace("[", "").replace("]", "").split(",")[0].replace("-", " ");
                WordElement.addEventListener("click", () => {
                    new Article(FoundArticle.id, FoundArticle.Name, FoundArticle.Content, FoundArticle.Author).Show();
                });
            });
        }
    });
}