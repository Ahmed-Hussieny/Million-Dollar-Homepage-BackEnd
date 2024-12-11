export const globalResponce = (err, req, res, next) => {
    if (err) {
        console.log(err);
        res.status(err['cause'] || 500).json({ 
            errCode : err['cause']||500,
            message : err['message'] || 'Internal Server Error',
            errLocation: err.stack
        });
        next();
    }
};