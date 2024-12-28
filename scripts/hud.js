import * as Api from "./api.js";

let Editing = false;

const SearchInput = document.querySelector(".SearchInput");
const DropdownList = document.querySelector(".DropdownList[search]");
const ArticleWizard = document.querySelector(".ArticleWizard");
ArticleWizard.style.display = "none";

const ArticleStorage = new Api.Storage("Articles");

const NewArticleButton = document.createElement("div");
NewArticleButton.innerHTML = "There was no article about that, click here to create one!";
NewArticleButton.style.display = "none";
NewArticleButton.style.cursor = "pointer";
NewArticleButton.addEventListener("click", () => {
    ArticleWizard.style.display = "initial";
    NewArticleButton.style.display = "none";
    ArticleWizard.querySelectorAll("input.ArticleTitleInput")[0].value = SearchInput.value;
});
DropdownList.appendChild(NewArticleButton);

const ArticleContent = document.querySelector(".ArticleContent");
ArticleContent.style.display = "none";

const PublishArticleButton = document.querySelector(".PublishArticleButton");
PublishArticleButton.addEventListener("click", async () => {
    if (Editing) return;

    const ArticleName = ArticleWizard.querySelectorAll("input.ArticleTitleInput")[0].value;
    const ArticleContent = ArticleWizard.querySelectorAll("textarea.ArticleContentInput")[0].value;
    if (!ArticleName || !ArticleContent) return;

    const Article = {
        Name: ArticleName,
        Content: ArticleContent,
        Author: JSON.parse(localStorage.getItem("User")).Username
    };

    await ArticleStorage.AppendDocument(Article);
    location.reload();
});

SearchInput.addEventListener("input", () => {
    const Search = SearchInput.value;
    if (!Search) return;

    const ExistingArticleElements = DropdownList.querySelectorAll("div[id]:not(#no-article)");
    ExistingArticleElements.forEach((Element) => {
        Element.remove();
    });

    const QuerySearchArticles = ArticleStorage.GetDocumentByFieldIncludes("Name", Search);
    QuerySearchArticles.then((FoundArticles) => {
        if (FoundArticles.length === 0) {
            NewArticleButton.style.display = "initial";
        } else {
            NewArticleButton.style.display = "none";

            FoundArticles.forEach((Article) => {
                const ExistingElement = DropdownList.querySelector(`div[id="${Article.id}"]`);
                if (ExistingElement) return;

                const ArticleElement = document.createElement("div");
                ArticleElement.innerHTML = Article.Name;
                ArticleElement.addEventListener("click", () => {
                    ArticleContent.querySelector(".Content").innerHTML = "";
                    ArticleContent.style.display = "initial";
                    ArticleContent.querySelector("header").textContent = Article.Name;
                    String(Article.Content).split(" ").forEach(Word => {
                        Word = String(Word);

                        let Element = {
                            Type: "span",
                            Size: "1em"
                        };

                        if (Word.startsWith("-")) {
                            Element.Type = "li";
                        } else if (Word.startsWith("#")) {
                            Element.Type = "header";
                            Element.Size = "2em";
                            Word = Word.replace("#", "");
                        }

                        const WordElement = document.createElement(Element.Type);
                        WordElement.textContent = Word;
                        WordElement.style.setProperty("--Size", Element.Size);
                        ArticleContent.querySelector(".Content").appendChild(WordElement);
                    });

                    if (Article.Author === JSON.parse(localStorage.getItem("User")).Username) {
                        ArticleContent.querySelector(".Bottombar").style.display = "";
                        ArticleContent.querySelector(".Bottombar").querySelector(".Delete").addEventListener("click", async () => {
                            await ArticleStorage.DeleteDocument(Article.id);
                            location.reload();
                        });
                        ArticleContent.querySelector(".Bottombar").querySelector(".Edit").addEventListener("click", () => {
                            ArticleWizard.style.display = "initial";
                            ArticleWizard.querySelectorAll("input.ArticleTitleInput")[0].value = Article.Name;
                            ArticleWizard.querySelectorAll("textarea.ArticleContentInput")[0].value = Article.Content;
                            Editing = true;
                        });

                        ArticleWizard.querySelectorAll("button.PublishArticleButton")[0].addEventListener("click", async () => {
                            const ArticleName = ArticleWizard.querySelectorAll("input.ArticleTitleInput")[0].value;
                            const ArticleContent = ArticleWizard.querySelectorAll("textarea.ArticleContentInput")[0].value;
                            if (!ArticleName || !ArticleContent) return;
                            if (!Article.id) return;

                            const UpdatedArticle = {
                                Name: ArticleName,
                                Content: ArticleContent,
                                Author: JSON.parse(localStorage.getItem("User")).Username
                            };

                            await ArticleStorage.UpdateDocument(Article.id, UpdatedArticle);
                            location.reload();
                        });
                    } else ArticleContent.querySelector(".Bottombar").style.display = "none";
                });
                ArticleElement.setAttribute("id", Article.id);

                const StartsWithSearch = Article.Name.toLowerCase().startsWith(Search.toLowerCase());
                ArticleElement.style.order = StartsWithSearch ? -1 : 1;

                DropdownList.appendChild(ArticleElement);
            });
        }
    });
});