import express, { Router, Request, Response, NextFunction } from "express";
import { createPost, PostService, PostStatService } from "../brains/post";
import { Post, CreatePostRequest} from "post"; //post.d.ts

const router: Router = Router();

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
    const postId = String(req.query.id);
    try {
        res.json({
            post: await PostService.getPostDB(postId)
        })
    } catch (error: any) {
        next(error)
    }
});

router.get("/stats", async (req: Request, res: Response, next: NextFunction) => {
    const postId = String(req.query.id);
    try {
        res.json({
            post: await PostStatService.getPostStatById(postId)
        })
    } catch (error: any) {
        next(error)
    }
});

router.post('/create_post', express.json({limit: '1mb'}), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { post_id: postId, content: textPayload }: CreatePostRequest = req.body;
        if (!postId || !textPayload) {
            throw { status: 400, name: 'Bad Request', message: 'Invalid post' };
        }
        if (postId.toLowerCase().split('').filter((char: string) => 'abcdefghijklmnopqrstuvwxyz0123456789-_'.includes(char)).length === 0) {
            throw { status: 400, name: 'Bad Request', message: 'Invalid Post ID' };
        }
        const post: Post = await createPost(String(postId).trimEnd().trimStart(), textPayload.trimEnd().trimStart());
        res.json({
            data: post,
        })
    } catch (error: any) {
        next(error);
    }
});

export default router;