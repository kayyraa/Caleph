import * as Api from "./api.js";

let Editing = false;

const ImageInput = document.createElement("input");
ImageInput.type = "file";
ImageInput.onchange = () => {
    Array.from(ImageInput.files).forEach(async (File) => {
        await new Api.GithubStorage(File).Upload(File.name);
        location.reload();
    });
}

const UploadImagesButton = document.querySelector(".UploadImagesButton");
UploadImagesButton.addEventListener("click", () => {
    ImageInput.click();
});

const SearchInput = document.querySelector(".SearchInput");
export const DropdownList = document.querySelector(".DropdownList[search]");
export const ArticleWizard = document.querySelector(".ArticleWizard");
ArticleWizard.style.display = "none";

const NewArticleButton = document.createElement("div");
NewArticleButton.innerHTML = "There was no article about that, click here to create one!";
NewArticleButton.style.display = "none";
NewArticleButton.style.cursor = "pointer";
NewArticleButton.style.order = "-1";
NewArticleButton.addEventListener("click", () => {
    ArticleWizard.style.display = "initial";
    NewArticleButton.style.display = "none";
    ArticleWizard.querySelectorAll("input.ArticleTitleInput")[0].value = SearchInput.value;
});
DropdownList.appendChild(NewArticleButton);

export const ArticleContent = document.querySelector(".ArticleContent");
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

    await Api.ArticleStorage.AppendDocument(Article);
    location.reload();
});

SearchInput.addEventListener("input", () => {
    const Search = SearchInput.value;
    if (!Search) return;

    const ExistingArticleElements = DropdownList.querySelectorAll("div[id]:not(#no-article)");
    ExistingArticleElements.forEach((Element) => {
        Element.remove();
    });

    const QuerySearchArticles = Api.ArticleStorage.GetDocumentByFieldIncludes("Name", Search);
    QuerySearchArticles.then((FoundArticles) => {
        if (FoundArticles.length === 0) {
            NewArticleButton.style.display = "initial";
        } else {
            NewArticleButton.style.display = "none";

            FoundArticles.forEach((Article) => {
                const ExistingElement = DropdownList.querySelector(`div[id="${Article.id}"]`);
                if (ExistingElement) return;

                if (Article.Name !== Search) NewArticleButton.style.display = "initial";

                const ArticleElement = document.createElement("div");
                ArticleElement.innerHTML = `<span>${Article.Name}</span><span>`
                ArticleElement.addEventListener("click", Event => {
                    if (Event.target !== ArticleElement.children[0]) return;

                    ArticleContent.querySelector(".Content").innerHTML = "";
                    ArticleContent.style.display = "initial";
                    ArticleContent.querySelector("header").textContent = Article.Name;

                    Api.FormatContent(Article.Content);

                    if (Article.Author === JSON.parse(localStorage.getItem("User")).Username) {
                        ArticleContent.querySelector(".Bottombar").style.display = "";
                        ArticleContent.querySelector(".Bottombar").querySelector(".Delete").addEventListener("click", async () => {
                            await Api.ArticleStorage.DeleteDocument(Article.id);
                            location.reload();
                        });

                        ArticleContent.querySelector(".Bottombar").querySelector(".Edit").addEventListener("click", () => {
                            ArticleWizard.style.display = "initial";
                            ArticleWizard.querySelectorAll("input.ArticleTitleInput")[0].value = Article.Name;
                            ArticleWizard.querySelectorAll("textarea.ArticleContentInput")[0].value = Article.Content;
                            Editing = true;
                        })

                        ArticleWizard.querySelectorAll("button.PublishArticleButton")[0].addEventListener("click", async () => {
                            const ArticleName = ArticleWizard.querySelectorAll("input.ArticleTitleInput")[0].value;
                            const ArticleContent = ArticleWizard.querySelectorAll("textarea.ArticleContentInput")[0].value;
                            if (!ArticleName || !ArticleContent) return;
                            if (!Article.id) return

                            const UpdatedArticle = {
                                Name: ArticleName,
                                Content: ArticleContent,
                                Author: JSON.parse(localStorage.getItem("User")).Username
                            }

                            await Api.ArticleStorage.UpdateDocument(Article.id, UpdatedArticle);
                            location.reload();
                        });
                    } else if (!Admins.includes(JSON.parse(localStorage.getItem("User")).Username)) ArticleContent.querySelector(".Bottombar").style.display = "none";
                });
                ArticleElement.setAttribute("id", Article.id)

                const AuthorLabel = document.createElement("span");
                AuthorLabel.innerHTML = `@${Article.Author}`;
                AuthorLabel.addEventListener("click", async (Event) => {
                    Event.preventDefault();

                    const TemporaryUrl = `./?user=${this.Author}`;
                    window.history.pushState(null, "", TemporaryUrl)

                    const UrlParams = new URLSearchParams(window.location.search);
                    const User = UrlParams.get("user");

                    if (!User) return;

                    document.body.innerHTML = `
                        <button onclick="location.href = '../index.html'">Return</button>
                        <h1 class="UsernameLabel">Profile: @${User}</h1>
                        <span class="UserArticlesLabel">User Articles: Loading</span>
                        <div style="background-color: rgba(255, 255, 255, 0.125) !important;"></div>
                    `;

                    await ArticleStorage.GetDocumentsByField("Author", User).then((Articles) => {
                        document.querySelector(".UserArticlesLabel").innerHTML = `User Articles: ${Articles.length}`;
                        Articles.forEach((Article) => {
                            const ArticleLabel = document.createElement("div");
                            ArticleLabel.innerHTML = `<span>${Article.Name}</span>`;
                            document.querySelector(".UserArticlesLabel").appendChild(ArticleLabel);
                        });
                    });
                });
                ArticleElement.appendChild(AuthorLabel);

                const StartsWithSearch = Article.Name.toLowerCase().startsWith(Search.toLowerCase());
                ArticleElement.style.order = StartsWithSearch ? -1 : 1;

                DropdownList.appendChild(ArticleElement);
            });
        }
    });
});