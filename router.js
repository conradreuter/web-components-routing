class RouterElement extends HTMLElement {
  constructor() {
    super()

    this._routes = new Set()

    this._handleHistoryChange = this._handleHistoryChange.bind(this)
  }

  connectedCallback() {
    window.addEventListener('popstate', this._handleHistoryChange)
  }

  disconnectedCallback() {
    window.removeEventListener('popstate', this._handleHistoryChange)
  }

  _handleHistoryChange(event) {
    for (const route of this._routes) {
      route.update()
    }
  }

  addRoute(route) {
    this._routes.add(route)
    route.update()
  }

  removeRoute(route) {
    this._routes.delete(route)
  }
}

class RouteElement extends HTMLElement {
  constructor() {
    super()

    this._unmountedChildren = document.createDocumentFragment()
  }

  connectedCallback() {
    delete this._fullPathCache
    delete this._regexCache

    if (this.isConnected) {
      this._router = this._findRouter()
      this._router.addRoute(this)
    }
  }

  _findRouter() {
    for (let currentNode = this.parentNode; currentNode; currentNode = currentNode.parentNode) {
      if (currentNode instanceof RouterElement) {
        return currentNode
      }
    }
    throw new Error('No Router found')
  }

  disconnectedCallback() {
    this._router.removeRoute(this)
  }

  get fullPath() {
    if (!this._regexCache) {
      this._fullPathCache = this._getParentFullPath() + this.getAttribute('path')
    }
    return this._fullPathCache
  }

  _getParentFullPath() {
    for (
      let currentNode = this.parentNode;
      currentNode !== this._router;
      currentNode = currentNode.parentNode
    ) {
      if (currentNode instanceof RouteElement) {
        return currentNode.fullPath
      }
    }
    return '#'
  }

  update() {
    const match = document.location.hash.match(this._regex)
    if (match === null) {
      this._unmountChildren()
    } else {
      this._mountChildren()
    }
  }

  get _regex() {
    if (!this._regexCache) {
      this._regexCache = pathToRegex(this.fullPath)
    }
    return this._regexCache
  }

  _mountChildren() {
    this.appendChild(this._unmountedChildren)
  }

  _unmountChildren() {
    for (const childNode of [...this.childNodes]) {
      this._unmountedChildren.appendChild(childNode)
    }
  }
}

function pathToRegex(path) {
  path = `^${path}`
  path = path.replace(/\//g, '\\/')
  return new RegExp(path)
}

export { RouteElement, RouterElement }
