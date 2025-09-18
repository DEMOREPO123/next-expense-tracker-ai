import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    "/dashboard(.*)", // protected
    "/profile(.*)", // protected
    "/settings(.*)", // protected
    "/(api|trpc)(.*)",
  ],
};
