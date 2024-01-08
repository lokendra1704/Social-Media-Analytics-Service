export type Post = {
    id: string;
    body: string;
};

export type PostDB = Post & {
    status?: number;
    created_at: Date | string;
    updated_at: Date | string;
};

export type PostStat = {
    id: string;
    wordCount: number;
    avgWordLength: number;
};

export type PostStatDB = {
    post_id: string;
    word_count: number;
    avg_word_length: number;
    created_at: string;
    updated_at: string
};

export type CreatePostRequest = {
    post_id: string;
    content: string;
};