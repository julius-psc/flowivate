import React from "react";
import BookLogger from "@/components/dashboard/features/books/BookLogger";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function BookDetailsPage(props: PageProps) {
    const params = await props.params;
    const { id } = params;

    return (
        <div className="p-2 h-full w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                <div className="md:col-span-3">
                    <BookLogger initialBookId={id} />
                </div>
            </div>
        </div>
    );
}
