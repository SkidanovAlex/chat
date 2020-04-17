  // Submits a new message to the devnet
  submitMessage() {
    //document.getElementById('input').value = '';
    let text = document.getElementById('input').value;
    console.log(this);
    // Calls the addMessage on the contract with arguments {text=text}.
    this._contract.addMessage({channel: this.state.targetChannel, thread_id: this.state.targetThreadId.toString(), text})
      .then(() => {
        // Starting refresh animation
        //$('#refresh-span').addClass(animateClass);
        //refreshMessages();
      })
      .catch(console.error);

    //pendingMsg = {'message_id': 1000000, 'channel': targetChannel, 'thread_id': targetThreadId ? targetThreadId : 1000000, 'sender': window.accountId, 'text': text};
    //refreshMessagesFast();
  }