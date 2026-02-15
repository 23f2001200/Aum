
export const getPresignedUrl = async (filename: string, contentType: string) => {
    // In a real app, uses AWS SDK getSignedUrl
    // Here, we return a local URL that the frontend can PUT to
    return {
        uploadUrl: `http://localhost:3001/uploads/${filename}`,
        key: filename
    };
};
