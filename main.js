// Defining some global constants
const animateClass = 'glyphicon-refresh-animate';
const loadingHtml = '<span class="glyphicon glyphicon-refresh glyphicon-refresh-animate"></span> Loading';
const appTitle = 'NEAR Guest Book';

// Defining global variables that we initialize asynchronously later.
let refreshTimeout;

let filterChannel = null;
let filterThread = null;

let targetChannel = "General";
let targetThreadId = 0;
let selectedMessage = null;
let threadNames = {};
let allThreads = [];
let threadsSet = {};

// Function that initializes the signIn button using WalletAccount
function signedOutFlow() {
  $('#login-button').click(() => {
    walletAccount.requestSignIn(
      // The contract name that would be authorized to be called by the user's account.
      window.nearConfig.contractName,
      appTitle
      // We can also provide URLs to redirect on success and failure.
      // The current URL is used by default.
    );
  });
}

function stringToHslColor(str, s, l) {
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  var h = hash % 360;
  return 'hsl('+h+', '+s+'%, '+l+'%)';
}

function getChannelElem(channel) {
  return $('<small/>').text('#' + channel).css({
    'background-color': stringToHslColor(channel, 50, 90),
    'border': '2px solid ' + stringToHslColor(channel, 50, 90),
    'border-radius': '2px',
    'cursor': 'pointer',
  }).on('click', function() {
    targetChannel = channel;
    filterChannel = channel;
    filterThread = null;
    targetThreadId = 0;
    pendingMsg = null;
    refreshMessages();
    updateTargetSpan();
    updateChannels();
    return false;
  });
}

function getThreadElem(channel, thread_id) {
  var threadName = $('<i>').text("Loading name for thread " + thread_id);
  if (threadNames[thread_id] !== undefined) {
    if (threadNames[thread_id].length == 0 || threadNames[thread_id][0] != '!') {
      threadName = $('<font color="grey">').text(threadNames[thread_id]);
    } else {
      threadName = $('<b>').text(threadNames[thread_id].substr(1));
    }
  } else {
    contract.getThreadName({thread_id: thread_id.toString()})
      .then(x => {
        threadNames[thread_id] = x;
        refreshMessages();
        updateTargetSpan();
      })
      .catch(console.log);
  }
  return $('<small/>').css({
    'overflow': 'hidden',
    'text-overflow': 'ellipsis',
    'white-space': 'nowrap',
    'max-width': '300px',
    'cursor': 'pointer',
  }).append(threadName).on('click', function() {
    filterChannel = channel;
    filterThread = thread_id;
    targetChannel = channel;
    targetThreadId = thread_id;
    pendingMsg = null;
    refreshMessages();
    updateTargetSpan();
    updateChannels();
    return false;
  });
}

function updateTargetSpan() {
  let objs = [
    getChannelElem(targetChannel),
  ];
  if (targetThreadId != 0) {
    objs.push(
        $("<small/>").text(" » "),
    );
    objs.push(
        getThreadElem(targetChannel, targetThreadId),
    );
  }
  $('#target_span').empty().append(objs);
}

function threadTitleEditorElem() {
  let name = (threadNames[filterThread] != null && threadNames[filterThread].length && threadNames[filterThread][0] == '!')
    ? threadNames[filterThread]
    : "Unnamed Thread";

  if (name.length && name[0] == '!') {
    name = name.substr(1);
  }

  let h1 = $('<span>').text(name);
  let ret = $('<span>').append(h1);

  if (name == 'Unnamed Thread') {
    console.log(1);
    h1.css('color', '#808080');
    h1.append($('<svg style="margin-left: 10px" width=24 height=24 xmlns="http://www.w3.org/2000/svg" viewBox="0 0 38 38"><defs><style>.cls-1{fill:none;stroke:#0071ce;stroke-linecap:round;stroke-linejoin:round;stroke-width:2px;}</style></defs><title>edit</title><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><circle class="cls-1" cx="19" cy="19" r="18"/><polyline class="cls-1" points="28 1 10 19 10 28 19 28 37 10"/><line class="cls-1" x1="10" y1="28" x2="28" y2="28"/><line class="cls-1" x1="37" y1="1" x2="19" y2="19"/></g></g></svg>'));
  } 
 
  h1.on('click', function() {
    ret.empty();
    let inp = $('<input>').val(name);
    ret.append(inp);
    let btn = $('<button>').text('Update');
    btn.on('click', function() {
      if (inp.val() != 'Unnamed Thread') {
        threadNames[filterThread] = '!' + inp.val();
        contract.setThreadName({'channel': filterChannel, 'thread_id': filterThread.toString(), 'name': inp.val()})
          .then(x => fetchThreadNamesAndUpdateChannels());
      }
      forceUpdateThread = true;
      refreshMessages();
      updateTargetSpan();
    });
    ret.append(btn);
    inp.focus();
    return false; 
  });

  return ret;
}

// Renders given array of messages
let lastFilterThead = null;
let lastFilterChannel = null;
let forceUpdateThread = true; 
let lastMessages = [];
let pendingMsg = null;
function renderMessages(m) {
  lastMessages = m;
  let messages = [...m.sort((x, y) => x.message_id - y.message_id)];
  if (pendingMsg != null) {
    messages.push(pendingMsg);
  }
  let objs = [];

  if (forceUpdateThread || filterThread != lastFilterThead || filterChannel != lastFilterChannel) {
    lastFilterThead = filterThread;
    lastFilterChannel = filterChannel;
    forceUpdateThread = false;
    if (filterThread != null) {
      $('#thread_title').empty();
      $('#thread_title').append(threadTitleEditorElem());
    } else if (filterChannel != null) {
      $('#thread_title').empty();
      $('#thread_title').append($('<span>').text('#' + filterChannel));      
    } else {
      $('#thread_title').empty();
      $('#thread_title').append($('<span>').text('All Channels'));
    }
  }

  for (let i = 0; i < messages.length; ++i) {
    let title_el = $('<div/>').css('margin-top', '10px').addClass('col-sm-3').append(
          $("<small/>").append([
            $('<span>').text("@"),
            $('<b>').text(messages[i].sender),
            $('<span>').text(" » ")
          ])
        ).append(
          getChannelElem(messages[i].channel),
        ).css({'white-space': 'nowrap', 'display': 'flex', 'align-items': 'center'});
    let is_selected = (selectedMessage == messages[i].message_id)
    if (messages[i].thread_id != messages[i].message_id || threadsSet[messages[i].thread_id]) {
      title_el.append([
        $("<small/>").text(" » "),
        getThreadElem(messages[i].channel, messages[i].thread_id),
      ])
    } else if (is_selected && filterThread == null) {
      title_el.append([
        $("<small/>").text(" » "),
        $('<a>').text('Start a Thread')
          .css('cursor', 'pointer')
          .on('click', function(x) {
            return function() {
              filterChannel = x.channel;
              filterThread = x.thread_id;
              targetChannel = x.channel;
              targetThreadId = x.thread_id;
              pendingMsg = null;
              refreshMessages();
              updateTargetSpan();
              updateChannels();
              return false;
            }
          }(messages[i])),
      ]);
    }

    objs.push(
      $('<div/>').addClass('row').css('background-color', is_selected ? '#F0F0F0': '#FFFFFF').append([
        title_el,
        $('<div/>').addClass('col-sm-9')
                   .addClass('message-text')
                   .text(messages[i].text),
      ]).on('click', function() {
        if (messages[i].message_id != 1000000) {
                     selectedMessage = messages[i].message_id,
                     forceUpdateThread = true;
                     refreshMessagesFast();
                     return false; 
                   }
      })
    );

/*    if (is_selected) {
      objs[objs.length - 1].append($('<div/>').addClass('col-sm-9').append([
//        $('<svg style="width: 24px; height: 24px;" viewBox="0 0 38 38" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="#0071ce" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="m32 32-18-18"/><path d="m37 19a18 18 0 1 0 -18 18h18"/><path d="m14 23v-9h9"/></g></svg>')
          $('<a>').text('Reply')
            .on('click', function(x) {
              return function() {
                targetThreadId = x;
                updateTargetSpan();
              }
            }(messages[i].thread_id == 0 ? messages[i].message_id : messages[i].thread_id)),
//        $('<svg style="margin-left: 6px; width: 24px; height: 24px;" viewBox="0 0 38 38" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="#0071ce" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="m22.94 28.56a3.94 3.94 0 0 1 -7.88 0"/><path d="m7.36 24.06 2.89-2.71a7.51 7.51 0 0 0 1.69-7.06 6.49 6.49 0 0 1 -.32-2c0-4.08 2.9-6.87 7.38-6.92a7.33 7.33 0 0 1 7.35 6.28 6.64 6.64 0 0 1 -.35 2.72 7.36 7.36 0 0 0 1.73 7l2.88 2.71c1.15 1.08.34 3.8-1.29 3.8h-17.43"/><path d="m19 1v6.09"/><circle cx="19" cy="19" r="18"/><path d="m37 1-36 36"/></g></svg>'),
//        $('<svg style="margin-left: 6px; width: 24px; height: 24px;" viewBox="0 0 38 38" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="#0071ce" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="m28 10v-9h-27v27h9"/><path d="m28 19v9h-9"/><path d="m10 10 18 18"/><path d="m37 10v27h-27"/></g></svg>'),
      ]));
    }*/
  }
  $('#messages').empty().append(objs);
  $('#messages').scrollTop(999999999);
  $('#refresh-span').removeClass(animateClass);
}

// Calls view function on the contract and sets up timeout to be called again in 5 seconds
// It only calls the contract if the this page/tab is active.
function refreshMessagesFast() {
  renderMessages(lastMessages);
}

function refreshMessages() {
  // If we already have a timeout scheduled, cancel it
  if (refreshTimeout) {
    clearTimeout(refreshTimeout);
    refreshTimeout = null;
  }
  // Schedules a new timeout
  refreshTimeout = setTimeout(refreshMessages, 1000);
  // Checking if the page is not active and exits without requesting messages from the chain
  // to avoid unnecessary queries to the devnet.
  if (document.hidden) {
    return;
  }
  // Adding animation UI
  $('#refresh-span').addClass(animateClass);
  // Calling the contract to read messages which makes a call to devnet.
  // The read call works even if the Account ID is not provided.
  let promise;
  if (filterThread != null) {
    promise = contract.getMessagesForThread({'channel': filterChannel, 'thread_id': filterThread.toString()});
  } else if (filterChannel != null) {
    promise = contract.getMessagesForChannel({'channel': filterChannel});
  } else {
    promise = contract.getAllMessages({});
  }
  
  promise.then(m => {
    if (m.length > lastMessages.length) {
      pendingMsg = null;
    }
    renderMessages(m)
  })
    .catch(console.log);
}

// Submits a new message to the devnet
function submitMessage() {
  let text = $('#text-message').val();
  $('#text-message').val('');
  // Calls the addMessage on the contract with arguments {text=text}.
  contract.addMessage({channel: targetChannel, thread_id: targetThreadId.toString(), text})
    .then(() => {
      // Starting refresh animation
      $('#refresh-span').addClass(animateClass);
      refreshMessages();
    })
    .catch(console.error);

  pendingMsg = {'message_id': 1000000, 'channel': targetChannel, 'thread_id': targetThreadId ? targetThreadId : 1000000, 'sender': window.accountId, 'text': text};
  refreshMessagesFast();
}

// Main function for the signed-in flow (already authorized by the wallet).
function signedInFlow() {
  // Hiding sign-in html parts and showing post message things
  $('#sign-in-container').addClass('hidden');
  $('#guest-book-container').removeClass('hidden');
  $('#logout-option').removeClass('hidden');

  // Displaying the accountId
  $('.account-id').text(window.accountId);

  // Focusing on the enter message field.
  $('#text-message').focus();

  // Adding handling for logging out
  $('#logout-button').click(() => {
    // It removes the auth token from the local storage.
    walletAccount.signOut();
    // Forcing redirect.
    window.location.replace(window.location.origin + window.location.pathname);
  });

  // Enablid enter key to send messages as well.
  $('#text-message').keypress(function (e) {
    if (e.which == 13) {
      e.preventDefault();
      submitMessage();
      return false;
    }
  });
  // Post button to send messages
  $('#submit-tx-button').click(submitMessage);
}

function fetchThreadNamesAndUpdateChannels() {
  contract.getAllThreads({}).then(x => { allThreads = x; updateChannels(); });
}

function updateChannels() {
  let channels = ['General', 'Staking', 'DevX'];
  let c = $('#channels');

  c.empty();

  let getElem = function(ch, tr, el) {
    el = $('<li>').append($('<a>').append(el)).css('cursor', 'pointer');
    el.on('click', function() {
      filterChannel = ch;
      filterThread = tr;
      if (filterChannel != null) {
        targetChannel = filterChannel;
      } else { 
        targetChannel = 'General';
      }
      pendingMsg = null;
      targetThreadId = filterThread != null ? filterThread : 0;
      console.log(filterChannel, filterThread);
      refreshMessages();
      updateTargetSpan();
      updateChannels(); 

      $('#navbar').attr('expanded', 'false');
      $('#navbar').attr('aria-expanded', 'false');
      $('#navbar').removeClass('in');
    });

    if (filterChannel == ch && filterThread == tr) {
      el.addClass('active');
    }
    return el;
  }

  c.append(getElem(null, null, $('<span>').text('All channels')));

  for (let i = 0; i < channels.length; ++ i) {
    let channel = channels[i];
    let el = $('<small/>').text('#' + channel).css({
      'background-color': stringToHslColor(channel, 50, 90),
      'border': '2px solid ' + stringToHslColor(channel, 50, 90),
      'border-radius': '2px',
      'color': 'black'
    });
    c.append(getElem(channel, null, el));
  }

  console.log(allThreads);
  for (let i = 0; i < allThreads.length; ++ i) {
    threadsSet[allThreads[i].thread_id] = 1;
    c.append(getElem(allThreads[i].channel, allThreads[i].thread_id, $('<span>').text(allThreads[i].name.substr(1))));
  }
}

// Initialization code
async function init() {
  console.log('nearConfig', nearConfig);

  // Initializing connection to the NEAR DevNet.
  window.near = await nearlib.connect(Object.assign({ deps: { keyStore: new nearlib.keyStores.BrowserLocalStorageKeyStore() } }, nearConfig));

  // Initializing Wallet based Account. It can work with NEAR DevNet wallet that
  // is hosted at https://wallet.nearprotocol.com
  window.walletAccount = new nearlib.WalletAccount(window.near);

  // Getting the Account ID. If unauthorized yet, it's just empty string.
  window.accountId = walletAccount.getAccountId();

  // Initializing the contract.
  // For now we need to specify method names from the contract manually.
  // It also takes the Account ID which it would use for signing transactions.
  contract = await near.loadContract(nearConfig.contractName, {
    viewMethods: ['getMessagesForThread', 'getAllMessages', 'getThreadName', 'getMessagesForChannel', 'getAllThreads'],
    changeMethods: ['addMessage', 'setThreadName', 'addContact'],
    sender: window.accountId,
  });

  // Enable wallet link now that config is available
  $('a.wallet').removeClass('disabled').attr('href', nearConfig.walletUrl);

  // Initializing messages and starting auto-refreshing.
  $('#messages').html(loadingHtml);
  $('#refresh-button').click(refreshMessages);
  refreshMessages();
  fetchThreadNamesAndUpdateChannels();

  // Based on whether you've authorized, checking which flow we should go.
  if (!walletAccount.isSignedIn()) {
    signedOutFlow();
  } else {
    signedInFlow();
    updateTargetSpan();
  }
}

init().catch(console.error);
