interface Headers {
    [index: string]: string;
}

interface Request {
    headers: Headers
    body: string
}

abstract class AstractWebAPI {
    abstract request(): Request
    abstract parseResopnse(body: string): boolean
}

export { type Headers, type Request, AstractWebAPI }