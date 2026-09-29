"use client";

import { useCreateOrUpdateBookMutation } from "@/hooks/use-library-queries";
import { Button } from "@repo/ui/components/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@repo/ui/components/dialog";
import { Field, FieldGroup, FieldLabel } from "@repo/ui/components/field";
import { Input } from "@repo/ui/components/input";
import { useForm } from "@tanstack/react-form-nextjs";
import { PlusCircle } from "lucide-react";
import { useState } from "react";

export function BookFormModal({
    onBookCreated,
}: {
    onBookCreated?: (bookId: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const createBookMutation = useCreateOrUpdateBookMutation();

    const form = useForm({
        defaultValues: {
            title: "",
            isbn: "",
            publishedYear: new Date().getFullYear(),
            numberOfCopies: 1,
            authorFirstName: "",
            authorLastName: "",
        },
        onSubmit: async ({ value }) => {
            if (!value.title.trim()) return;
            const res = await createBookMutation.mutateAsync({
                title: value.title.trim(),
                isbn: value.isbn.trim() || undefined,
                publishedYear: Number(value.publishedYear) || undefined,
                numberOfCopies: Math.max(1, Number(value.numberOfCopies) || 1),
                authorFirstName: value.authorFirstName.trim() || undefined,
                authorLastName: value.authorLastName.trim() || undefined,
            });

            form.reset();
            setOpen(false);
            if (res?.bookId && onBookCreated) {
                onBookCreated(res.bookId);
            }
        },
    });

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-1.5 shadow-sm">
                    <PlusCircle className="h-4 w-4" />
                    Add / Manage Book
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                    <DialogTitle>Add or Update Library Book</DialogTitle>
                    <DialogDescription>
                        Register a new book into the catalog or adjust inventory copies.
                    </DialogDescription>
                </DialogHeader>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        void form.handleSubmit();
                    }}
                >
                    <FieldGroup className="space-y-4 py-2">
                        <form.Field
                            name="title"
                            validators={{
                                onChange: ({ value }) => (value.trim() ? undefined : "Title is required"),
                            }}
                        >
                            {(field) => (
                                <Field>
                                    <FieldLabel htmlFor="book-title">Book Title</FieldLabel>
                                    <Input
                                        id="book-title"
                                        placeholder="e.g. The Great Gatsby"
                                        value={field.state.value}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        required
                                    />
                                    {field.state.meta.errors.length > 0 ? (
                                        <p className="text-xs text-destructive mt-1">{field.state.meta.errors.join(", ")}</p>
                                    ) : null}
                                </Field>
                            )}
                        </form.Field>

                        <div className="grid grid-cols-2 gap-3">
                            <form.Field name="authorFirstName">
                                {(field) => (
                                    <Field>
                                        <FieldLabel htmlFor="author-fname">Author First Name</FieldLabel>
                                        <Input
                                            id="author-fname"
                                            placeholder="F. Scott"
                                            value={field.state.value}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                        />
                                    </Field>
                                )}
                            </form.Field>
                            <form.Field name="authorLastName">
                                {(field) => (
                                    <Field>
                                        <FieldLabel htmlFor="author-lname">Author Last Name</FieldLabel>
                                        <Input
                                            id="author-lname"
                                            placeholder="Fitzgerald"
                                            value={field.state.value}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                        />
                                    </Field>
                                )}
                            </form.Field>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <form.Field name="isbn">
                                {(field) => (
                                    <Field>
                                        <FieldLabel htmlFor="book-isbn">ISBN (Unique)</FieldLabel>
                                        <Input
                                            id="book-isbn"
                                            placeholder="978-0743273565"
                                            value={field.state.value}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                        />
                                    </Field>
                                )}
                            </form.Field>
                            <form.Field name="publishedYear">
                                {(field) => (
                                    <Field>
                                        <FieldLabel htmlFor="book-year">Published Year</FieldLabel>
                                        <Input
                                            id="book-year"
                                            type="number"
                                            placeholder="1925"
                                            value={field.state.value}
                                            onChange={(e) => field.handleChange(Number(e.target.value))}
                                        />
                                    </Field>
                                )}
                            </form.Field>
                        </div>

                        <form.Field
                            name="numberOfCopies"
                            validators={{
                                onChange: ({ value }) => (Number(value) >= 1 ? undefined : "Must have at least 1 copy"),
                            }}
                        >
                            {(field) => (
                                <Field>
                                    <FieldLabel htmlFor="book-copies">Number of Total Copies</FieldLabel>
                                    <Input
                                        id="book-copies"
                                        type="number"
                                        min={1}
                                        value={field.state.value}
                                        onChange={(e) => field.handleChange(Number(e.target.value))}
                                        required
                                    />
                                    {field.state.meta.errors.length > 0 ? (
                                        <p className="text-xs text-destructive mt-1">{field.state.meta.errors.join(", ")}</p>
                                    ) : null}
                                </Field>
                            )}
                        </form.Field>
                    </FieldGroup>

                    <DialogFooter className="mt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
                            {([canSubmit, isSubmitting]) => (
                                <Button
                                    type="submit"
                                    disabled={!canSubmit || isSubmitting || createBookMutation.isPending}
                                >
                                    {isSubmitting || createBookMutation.isPending ? "Saving..." : "Save Book"}
                                </Button>
                            )}
                        </form.Subscribe>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
