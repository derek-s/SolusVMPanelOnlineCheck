let {classes: Cc, interfaces: Ci, results: Cr, utils: Cu} = Components;

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "Services",
  "resource://gre/modules/Services.jsm");

XPCOMUtils.defineLazyModuleGetter(this, "Homepage",
  "resource://ntab/mozCNUtils.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "NTabDB",
  "resource://ntab/NTabDB.jsm");

let mozCNWebChannelContent = {
  specs: [
    "http://e.firefoxchina.cn/",
    "http://i.firefoxchina.cn/",
    "http://n.firefoxchina.cn/",
    "http://newtab.firefoxchina.cn/",
    NTabDB.spec
  ],
  cachedWindows: new Map(),
  messageName: "mozCNUtils:WebChannel",

  get channelID() {
    let prefKey = "webchannel.allowObject.urlWhitelist";
    delete this.channelID;
    return this.channelID = Services.prefs.getPrefType(prefKey) ?
                            "moz_cn_channel_v2" : "moz_cn_utils";
  },

  handleEvent: function(aEvt) {
    switch (aEvt.type) {
      case "mozCNUtils:Register":
        switch (aEvt.detail.subType) {
          case "defaultBrowser.maybeEnableSetDefaultBrowser":
            this.maybeEnableSetDefaultBrowser(aEvt);
            break;
          case "searchEngine.maybeEnableSwitchToBaidu":
            this.maybeEnableSwitchToBaidu(aEvt);
            break;
          case "startup.maybeHighlightSetHomepage":
            this.maybeHighlightSetHomepage(aEvt);
            break;
          /* tools ? */
        }
        break;
    }
  },

  init: function() {
    let self = this;
    Services.obs.addObserver(this, "content-document-global-created", false);
    addEventListener("unload", function() {
      Services.obs.removeObserver(self, "content-document-global-created");
    });

    // relay WebChannel response to qualified inner windows
    addEventListener("WebChannelMessageToContent", function (aEvt) {
      if (aEvt.target !== content) {
        return;
      }

      self.cachedWindows.forEach(function(aWindow) {
        try {
          let evt = new aWindow.CustomEvent("WebChannelMessageToContent", {
            detail: Cu.cloneInto(aEvt.detail, aWindow),
          });
          aWindow.dispatchEvent(evt);
        } catch(e) {};
      });
    }, true, true);
  },

  observe: function(aSubject, aTopic, aData) {
    switch (aTopic) {
      case "content-document-global-created":
        if (!content || !aSubject || aSubject.top !== content) {
          return;
        }

        if (!this.specs.some(function(aSpec) {
          return Services.io.newURI(aSpec, null, null).prePath === aData;
        })) {
          return;
        }

        aSubject.wrappedJSObject.mozCNChannel = this.channelID;
        aSubject.addEventListener("mozCNUtils:Register", this, true, true);
        if (aSubject.top === aSubject) {
          return;
        }

        let innerID = aSubject.QueryInterface(Ci.nsIInterfaceRequestor).
          getInterface(Ci.nsIDOMWindowUtils).currentInnerWindowID;
        let self = this;
        aSubject.addEventListener("unload", function(aEvt) {
          self.cachedWindows.delete(innerID);
        }, false);

        this.cachedWindows.set(innerID, aSubject);
        break;
    }
  },

  isElementVisible: function(aElement) {
    if (aElement.hidden) {
      return false;
    }
    let style = aElement.style;
    if (style.display === "none" || style.visibility === "hidden") {
      return false;
    }
    let rect = aElement.getBoundingClientRect();
    if (!rect.height || !rect.width) {
      return false;
    }
    return true;
  },

  maybeEnableSetDefaultBrowser: function(aEvt) {
    if (aEvt.target.document.documentURI !== NTabDB.spec) {
      return;
    }

    let self = this;
    let messageType = "isFxDefaultBrowser";
    let listener = {
      receiveMessage: function(msg) {
        let data = msg.data || {};
        if (data.type !== messageType) {
          return;
        }
        removeMessageListener(msg.name, listener);
        
        /* undefined: no shellService,
           true: is default,
           false: is not default */
        if (data.data !== false) {
          return;
        }
        let { button } = aEvt.detail.elements;
        button.addEventListener('click', function() {
          sendAsyncMessage(self.messageName, {
            type: "setFxAsDefaultBrowser"
          });
          button.setAttribute('hidden', 'true');
        }, false, /** wantsUntrusted */false);
        button.removeAttribute('hidden');
      }
    };
    addMessageListener(this.messageName, listener);
    sendAsyncMessage(this.messageName, {
      type: messageType
    });
  },

  maybeEnableSwitchToBaidu: function(aEvt) {
    if (!aEvt.target.top.document.documentURI.startsWith("about:neterror")) {
      return;
    }

    let self = this;
    let { form, text, check } = aEvt.detail.elements;
    let checkbox = check &&
      check.querySelector('input[type="checkbox"]');
    if (!form || !text || !checkbox) {
      return;
    }

    let messageType = "isBaiduCurrentSearch";
    let listener = {
      receiveMessage: function(msg) {
        let data = msg.data || {};
        if (data.type !== messageType) {
          return;
        }
        removeMessageListener(msg.name, listener);
        text.value = data.data.searchText;
        if (data.data.isCurrent) {
          return;
        }
        if (!data.data.exists) {
          return;
        }
        check.hidden = false;
        form.addEventListener("submit", function() {
          if (self.isElementVisible(check) && checkbox.checked) {
            sendAsyncMessage(self.messageName, {
              type: "setBaiduAsCurrentSearch"
            });
          }
        }, false, /** wantsUntrusted */false);
      }
    };
    addMessageListener(this.messageName, listener);
    sendAsyncMessage(this.messageName, {
      type: messageType
    });
  },

  maybeHighlightSetHomepage: function(aEvt) {
    let win = aEvt.target;
    let referenceURI = win.document.documentURIObject;
    let { anchor } = aEvt.detail.elements;
    let { confirmMsg, highlight, url } = aEvt.detail.extras;

    anchor.addEventListener('click', function() {
      if (confirmMsg && !win.confirm(confirmMsg)) {
        return;
      }

      Homepage.setHomepage(url, referenceURI);
      anchor.classList.remove(highlight);
    }, false, /** wantsUntrusted */false);

    if (Homepage.isHomepage(url, referenceURI)) {
      anchor.classList.remove(highlight);
    } else {
      anchor.classList.add(highlight);
    }
  }
};
mozCNWebChannelContent.init();
