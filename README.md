# StudyBuddyAI

StudyBuddyAI is an innovative application designed to revolutionize the way students study. It harnesses the power of Artificial Intelligence (AI) to transform your study materials into interactive question cards, making learning more engaging and effective.

## Core Features

### AI Question Generation

At the heart of StudyBuddyAI is its intelligent AI, powered by Gemini, which analyzes uploaded study materials to generate relevant and challenging question cards. The Large Language Model (LLM) intelligently determines when and how to incorporate information from your documents into meaningful questions.

### Interactive Question Cards

Each question card is designed with a clear question on the front and the corresponding answer on the back. Students can easily flip the card to reveal the answer, enhancing the learning process. A 'Next Question' button allows for seamless progression through the generated cards.

### Material Upload and Customization

Users can upload a variety of study materials, such as lecture slides or notes, directly to the application. Additionally, you have the flexibility to specify the desired number of question cards you wish to generate, tailoring the study session to your needs.

## Style Guidelines

StudyBuddyAI is crafted with a focus on creating a calm and focused study environment. Here are the style guidelines that guide the app's design:

-   **Primary Color**: Soft Teal (`#4DB6AC`) for a calming and focused study environment.
-   **Secondary Color**: Light Gray (`#EEEEEE`) for clean backgrounds and content separation.
-   **Accent**: Amber (`#FFD54F`) to highlight important elements and CTAs.
-   **Font**: A clean and readable font for questions and answers.
-   **Icons**: Simple and intuitive icons for actions like 'Upload,' 'Next,' and 'Flip'.
-   **Layout**: Card-based layout for questions and answers, providing a clear and organized structure.
-   **Animation**: Smooth card flip animation to reveal answers, providing a visually engaging experience.

## Project Structure

This project is built using Next.js, offering a structured and scalable architecture. The code is organized into several key directories and files, including:

`src/ai/`: Contains the AI logic, including `ai-instance.ts` for the main AI interaction and `flows/` for specific tasks like `generate-question-cards.ts` and `process-study-material.ts`.
`src/app/`: Includes core application components like `page.tsx`, `layout.tsx`, and global styles (`globals.css`).
`src/components/`: Houses all reusable UI components, including custom ones like `question-card.tsx` and `material-uploader.tsx`, and `ui/` for base UI components like buttons, cards, etc.
`src/context/`: Manages application-wide state with files like `SavedCardsContext.tsx`.
`src/hooks/`: Contains custom hooks like `use-toast.ts` and `use-mobile.tsx`.
