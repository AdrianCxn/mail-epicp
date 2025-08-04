document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', () => compose_email(false));
  // Add Event Listener for the compose email form
  document.querySelector('#compose-form').addEventListener('submit', send_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email(isReply) {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';

  // Clear out composition fields IF not replying
  if (!isReply) {
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
  }
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';

  // Show the mailbox name and create a div for the emails
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Load the appropiate mailbox
  // Writing down the malboxes names
  const mailboxes = ['inbox', 'sent', 'archive']
  
  // Checking if the mailbox is in the mailboxes array
  if (!mailboxes.includes(mailbox)) {
    console.log('Error! Invalid mailbox.');
    return;
  }

  // Use the API
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      // Create div for each email
      emails.forEach(email => {
        const emailDiv = document.createElement('div');
        emailDiv.innerHTML = "<strong>From: </strong>" + email.sender + "<br><strong>Subject: </strong>" + email.subject + 
                              "<br><strong>Sent: </strong>" + email.timestamp;
        emailDiv.className = "email";
        // Add an event listener to each emailDiv to take the user to respective email
        emailDiv.addEventListener('click', function() {
          fetch(`/emails/${email.id}`)
          .then(response => response.json())
          .then(email => {
              read_email(email);
          });
        });
        // Background color depends on read status
        if (email.read) {
          emailDiv.style.backgroundColor = "lightgray";
        } else {
          emailDiv.style.backgroundColor = "white";
        }
        document.querySelector('#emails-view').append(emailDiv);
      });
  });
}

function send_email() {
  
  // Get the email information
  const sender = document.getElementById('compose-sender').value;
  const recipients = document.getElementById('compose-recipients').value;
  const subject = document.getElementById('compose-subject').value;
  const body = document.getElementById('compose-body').value;

  // Use API
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        sender: sender,
        recipients: recipients,
        subject: subject,
        body: body
    })
  })
  .then(response => response.json())
  .then(result => {
      // Print result
      console.log(result);
  });

  // Make form not submit
  return false;
}

function read_email(email) {

  // Show the email and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';

  // Clear div before adding the new email to it
  document.querySelector('#email-view').innerHTML = '';

  // Create div for the data
  const emailView = document.createElement('div');
  emailView.className = "email-data";
  emailView.innerHTML = "<strong>From: </strong>" + email.sender + "<br><strong>To: </strong>" + email.recipients + 
                        "<br><strong>Sent: </strong>" + email.timestamp + "<br>" + "<br><strong>Subject: </strong>" + 
                        email.subject + "<br>" + "<br><strong>Body: </strong>" + "<br>" + email.body + "<br>";

  // Creating reply button
  const replyButton = document.createElement('button');
  replyButton.className = 'btn btn-secondary';
  replyButton.textContent = 'Reply'
  replyButton.style.marginRight = '10px';
  replyButton.addEventListener('click', function() {
    document.getElementById('compose-recipients').value = `${email.sender}`;
    if (email.subject.startsWith("Re: ")) {
      document.getElementById('compose-subject').value = `${email.subject}`;
    } else {
      document.getElementById('compose-subject').value = `Re: ${email.subject}`;
    }
    document.getElementById('compose-body').value = `On ${email.timestamp} ${email.sender} wrote:\n${email.body}\n-------------------------\n`;
    compose_email(true);
  })
                    
  emailView.append(document.createElement('br'), replyButton);

  // Creating archieve button if the email was recieved, not sent
  // Recieving current user email from the inbox.html template
  const currentUserEmail = window.currentUserEmail;
  if (email.sender !== currentUserEmail) {
    const archiveButton = document.createElement('button');
    archiveButton.className = 'btn btn-secondary';
    if (email.archived === true) {
      archiveButton.textContent = 'Unarchive';
    } else {
      archiveButton.textContent = 'Archive';
    }
    archiveButton.addEventListener('click', function() {
      if (email.archived === true) {
        fetch(`/emails/${email.id}`, {
          method: 'PUT',
          body: JSON.stringify({
              archived: false
          })
        })
        .then(() => load_mailbox('inbox'))
      } else {
        fetch(`/emails/${email.id}`, {
          method: 'PUT',
          body: JSON.stringify({
              archived: true
          })
        })
        .then(() => load_mailbox('inbox'))
      }
    });

    emailView.append(archiveButton);
  }

  // Add everything to the emailView div
  document.querySelector("#email-view").append(emailView);

  // Mark the email as read if not already
  if (!email.read) {
    fetch(`/emails/${email.id}`, {
      method: 'PUT',
      body: JSON.stringify({
          read: true
      })
    })
  }
}