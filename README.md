# Quill Paginated Editor

 A paginated document editor built on top of [Quill 2.x](<https://quilljs.com/>), [Angular 21](<https://angular.dev/>) and TypeScript.

 The goal of this project is to provide a document-editing experience where content is displayed as physical pages instead of one continuous editor.

 > 🚧 **This project is an experimental MVP and is currently under active development.**

 ## Why?

 Quill provides an excellent rich-text editing experience, but its editor is fundamentally continuous.

 For applications that generate documents such as:

 - Reports
- Contracts
- Invoices
- Letters
- Proposals
- Academic documents
- Business documents
- Printable forms

 it is often useful to see the document as it will appear when printed or exported to PDF.

 This project explores how to add a paginated document experience on top of Quill without modifying or forking Quill's core.

 ## Goals

 The main goal is to create a reusable pagination layer around Quill.

 The project aims to support:

 - 📄 A4 pages
- 📄 Letter pages
- 📄 Legal pages
- ↕️ Portrait and landscape orientation
- 📏 Configurable margins
- 📑 Automatic page breaks
- ➕ Manual page breaks
- 🧾 Headers
- 🦶 Footers
- 🔢 Page numbers
- 🖼️ Images
- 📝 Rich text formatting
- 📋 Lists
- 📊 Tables
- 🖨️ Print-friendly rendering
- 📦 PDF generation
- ⚡ Efficient pagination for larger documents

 ## Architecture

 The project intentionally keeps Quill separate from the pagination engine.

```
                    ┌──────────────────┐
                    │      Quill       │
                    │      Editor      │
                    └────────┬─────────┘
                             │
                           Delta
                             │
                             ▼
                  ┌─────────────────────┐
                  │   Document Model    │
                  └──────────┬──────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │ Pagination Engine   │
                  └──────────┬──────────┘
                             │
                 ┌───────────┴───────────┐
                 ▼                       ▼
        ┌─────────────────┐     ┌─────────────────┐
        │ Paginated View  │     │  PDF Renderer   │
        └─────────────────┘     └─────────────────┘
```

 ### Important design principle

 **Quill Delta is the source of truth.**

 The DOM is used for rendering and layout measurements, but it is not the canonical document model.

 Pagination is derived state.

```
Quill Delta
    │
    ├──> Paginated Layout
    │
    └──> PDF
```

 The original Delta should remain unchanged by pagination.

 ## Why not modify Quill?

 This project intentionally avoids modifying Quill's source code whenever possible.

 Instead, it explores an application-level architecture using:

 - Quill APIs
- Quill modules
- Custom Blots
- Angular components
- Layout services
- Pagination services
- DOM measurements
- CSS print/layout capabilities

 A Quill fork should only be considered if a requirement cannot reasonably be implemented through these extension points.

 ## Page Model

 A document can be configured with properties such as:

```
interface DocumentSettings {
  page: {
    size: 'A4' | 'LETTER' | 'LEGAL';
    orientation: 'portrait' | 'landscape';
  };

  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
    unit: 'mm';
  };

  header: {
    enabled: boolean;
    height: number;
  };

  footer: {
    enabled: boolean;
    height: number;
  };
}
```

 The exact API may evolve as the MVP develops.

 ## Pagination

 Pagination is based on rendered dimensions rather than character count.

 For example:

```
┌───────────────────────────────┐
│            HEADER             │
├───────────────────────────────┤
│                               │
│  Document content             │
│                               │
│  Paragraph                    │
│  Paragraph                    │
│  Image                        │
│  List                         │
│                               │
├───────────────────────────────┤
│            FOOTER             │
└───────────────────────────────┘
```

 When the available content area is exhausted, the layout engine creates the next page.

 Long content should be able to continue across pages where appropriate.

 ## Current Status

 This project is currently an MVP / research implementation.

 ### Planned development

 - [ ] Project setup
- [ ] Quill integration
- [ ] Document model
- [ ] Page geometry
- [ ] A4 page rendering
- [ ] Configurable margins
- [ ] Basic pagination
- [ ] Long paragraph splitting
- [ ] Manual page breaks
- [ ] Headers
- [ ] Footers
- [ ] Page numbers
- [ ] Images
- [ ] Lists
- [ ] Tables
- [ ] PDF rendering
- [ ] Performance optimization
- [ ] Automated tests
- [ ] Documentation

 The API and architecture may change significantly while the MVP is being developed.

 ## Technology

 - Angular 21
- TypeScript
- Quill 2.x
- HTML / CSS
- Modern browser APIs

 Additional dependencies will be kept to a minimum and introduced only when they provide clear value.

 ## Development

 Clone the repository:

```
git clone https://github.com/alejandro-d3v/quill-paginated-editor.git
cd quill-paginated-editor
```

 Install dependencies:

```
npm install
```

 Start the development server:

```
npm start
```

 Then open the application in your browser.

 ## Project Principles

 This project follows a few important principles:

 1. **Keep Quill as the editor.**
2. **Keep Delta as the source of truth.**
3. **Keep pagination as a separate concern.**
4. **Keep PDF generation separate from editing.**
5. **Avoid modifying Quill's core.**
6. **Prefer small, testable services.**
7. **Do not paginate based on character count.**
8. **Never silently lose document content.**
9. **Keep the architecture reusable.**
10. **Measure performance before optimizing.**

 ## Contributing

 Contributions, ideas and experiments are welcome.

 If you are interested in:

 - Quill internals
- document layout
- pagination algorithms
- browser rendering
- print CSS
- PDF generation
- rich-text editors
- Angular
- TypeScript

 feel free to open an issue or submit a pull request.

 Because this is an experimental MVP, please open an issue before implementing large architectural changes.

 ## Roadmap

 The long-term goal is to determine whether a robust paginated editing experience can be implemented as a reusable layer around Quill.

 If successful, the concepts developed here can potentially be integrated into applications that need document-style editing and PDF/print output.

 ## License

 This project is licensed under the [MIT License](LICENSE).
