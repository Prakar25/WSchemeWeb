/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useRef, useState } from "react";
import { Editor } from "@tinymce/tinymce-react";
import sanitizeHtml from "sanitize-html";

import Error from "../outputs/Error";

export default function RichTextArea({
  defaultName,
  register,
  name,
  showInput,
  classes,
  data,
  required,
  pattern,
  errors,
  setError,
  clearError,
  setValue,
  setChangesMade,
  rows = 6, // default no. of rows
  ...rest
}) {
  const [isEdited, setIsEdited] = useState(false);
  const editorRef = useRef(null);

  // Set initial value only once
  data && !isEdited && setValue(defaultName, data);

  // Convert rows → height (1 row ≈ 48px)
  const editorHeight = rows * 48;

  return (
    <div
      className={`${
        showInput === undefined || showInput === true
          ? "flex flex-col"
          : "hidden"
      } w-full mb-6 justify-center items-start`}
    >
      <p className="font-bold text-left mb-1">
        {name} {required && <span className="text-red-700">*</span>}
      </p>

      <Editor
        {...register(defaultName, { required: true, pattern })}
        onInit={(evt, editor) => (editorRef.current = editor)}
        apiKey="011i9gns75l9c2uo0oxnzp24x0v4719i3t0vix9npkqwvcg9"
        scriptLoading={{ async: true }}
        initialValue={data}
        init={{
          height: editorHeight, // dynamic height
          width: "100%",
          menubar: false,
          plugins: [
            "advlist",
            "autolink",
            "lists",
            "link",
            "image",
            "charmap",
            "preview",
            "anchor",
            "searchreplace",
            "visualblocks",
            "code",
            "fullscreen",
            "insertdatetime",
            "media",
            "table",
            "help",
            "wordcount",
          ],
          toolbar:
            "undo redo | blocks | bold italic forecolor | " +
            "alignleft aligncenter alignright alignjustify | " +
            "bullist numlist outdent indent | removeformat | help",
          content_style:
            "body { font-family: Helvetica, Arial, sans-serif; font-size: 14px; }",
        }}
        onEditorChange={(value) => {
          const clean = sanitizeHtml(value);
          setIsEdited(true);
          setValue(defaultName, clean || "");
        }}
      />

      {errors[defaultName]?.type === "required" && (
        <Error classes="flex gap-1 mt-1" message={`${name} is required`} />
      )}

      {errors[defaultName]?.type === "pattern" && (
        <Error classes="flex gap-1 mt-1" message={`${name} is not valid`} />
      )}

      {errors[defaultName]?.type === "manual" && (
        <Error classes="flex gap-1 mt-1" message={`${name} is not available`} />
      )}
    </div>
  );
}
