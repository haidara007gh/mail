document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  const optional = new Object();
  document.querySelector('#compose').addEventListener('click', () => compose_email(optional));

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email(email) {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Check for email and fill out data in case it's a reply
  if (email.subject === undefined){
    // Clear out composition fields
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
  }
  else{
    if (email.subject.slice(0,3) !== 'Re:'){
      document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
    }
    else{
      document.querySelector('#compose-subject').value = email.subject;
    }
    document.querySelector('#compose-recipients').value = email.sender;
    document.querySelector('#compose-body').value = `"On ${email.timestamp} ${email.sender} wrote: "${email.body}\n\n`;
  }
  
  
  // Defining what should happen when we press submit 
  document.querySelector('#compose-form').onsubmit = () => {
    
    // Collect data from various datafields
    const recipients = document.querySelector("#compose-recipients").value;
    const subject = document.querySelector("#compose-subject").value;
    const body = document.querySelector("#compose-body").value;

    fetch('/emails',{
      method:'POST',
      body:JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
      })
    })
    .then(response => response.json())
    .then(result => {
      console.log(result);
    });

    load_mailbox('sent');
    return false;
  }
    
  
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    console.log(emails);
  
  if (mailbox === 'sent'){
    document.querySelector('#email-view').style.display = 'none';
    for(let i = 0; i < emails.length; i++){
      const element = document.createElement("div");
      element.setAttribute("id", "sentdiv");
      element.innerHTML = `${emails[i].recipients}<h5>Subject: ${emails[i].subject}</h5><h6>Body: ${emails[i].body}<h6/><br>`;
      document.querySelector('#emails-view').append(element);
    }
  }
  else if(mailbox === 'inbox'){
    for(let i = 0; i < emails.length; i++){
      
      const element = document.createElement("div");
      element.setAttribute("class", "inboxdiv");
      
      element.innerHTML = `<strong>${emails[i].sender}</strong><span> ${emails[i].subject} </span><span>${emails[i].timestamp}</span><br>`;
      document.querySelector('#emails-view').append(element);
      
      //assign email ids as data-email_id
      const email_id = emails[i].id;
      element.setAttribute('data-email_id' ,email_id);

      //Marking read and unread mails 
    
        if (emails[i].read == true){
          element.setAttribute('data-read',1);
        }
        else{
          element.setAttribute('data-read',0);
        }
  
    }
    
    //Opening the email view when clicked
    document.querySelectorAll('.inboxdiv').forEach(email => {
      // Applying gray to emails that have been read
      if (email.dataset.read == 1){
        email.style.backgroundColor = 'lightgrey';
      }
      
      // When an email in ibox is clicked 
      email.onclick = () => {

        document.querySelector('#emails-view').style.display = 'none';
        
        const email_id = email.dataset.email_id;

        fetch(`/emails/${email_id}`)
        .then(response=>response.json())
        .then(email => {
          console.log(email);
          
          document.querySelector('#email-view').style.display = 'block';
          
          // Email view details
          const element = document.createElement("div");
          element.innerHTML = `<strong>From:</strong>${email.sender}<br><strong>To:</strong>${email.recipients}<br><strong>Subject:</strong>${email.subject}<br><strong>Timestamp:</strong>${email.timestamp}<br>`;
          document.getElementById('email-view').innerHTML = '';
          document.querySelector('#email-view').append(element);

          //Adding a button to archive email
          const archivebtn = document.createElement("button");
          archivebtn.innerHTML = 'Archive';
          archivebtn.setAttribute("id","archivebtn");
          archivebtn.setAttribute("class", "btn btn-dark");
          document.querySelector('#email-view').appendChild(archivebtn);

          //Adding a button to reply emails
          const replybtn  = document.createElement('button');
          replybtn.innerHTML = 'Reply';
          replybtn.setAttribute('id','replybtn');
          replybtn.setAttribute('class','btn btn-dark');
          document.querySelector("#email-view").appendChild(replybtn);

          const body = document.createElement('hr');
          body.innerHTML = email.body;
          document.querySelector('#email-view').append(body);
          
          // Eventlistener for Archive button
          document.querySelector("#archivebtn").addEventListener('click', ()=> {
            fetch(`/emails/${email_id}`, {
              method: 'PUT',
              body: JSON.stringify({'archived': true})
            })
            .then(load_mailbox('inbox'));
          });

          // Eventlistener for Reply button
          document.querySelector('#replybtn').addEventListener('click', () => {
            compose_email(email);
          } );

          // Marking email as read after opening 
          fetch(`/emails/${email_id}`,{
            method: 'PUT',
            body: JSON.stringify({'read':true})
          });

        })
        .catch((error)=>{
          console.log(error);
        })
        
      }
    })

  }
  
  else if (mailbox === 'archive'){     //archived
    for (let i = 0; i < emails.length; i++){
      const element  = document.createElement('div');
      element.innerHTML = `<strong>${emails[i].sender}</strong><span> ${emails[i].subject} </span><span>${emails[i].timestamp}</span><br>`;
      document.querySelector('#emails-view').append(element);
      element.setAttribute("class", "archivediv");
      const email_id = emails[i].id;
      element.setAttribute("data-email_id", email_id);
      
    }
    document.querySelectorAll(".archivediv").forEach(email => {
      email.onclick = () => {
        document.querySelector('#emails-view').style.display = 'none';
        email_id = email.dataset.email_id
      
        fetch(`/emails/${email_id}`)
        .then(response => response.json())
        .then(email => {
          
          document.querySelector('#email-view').style.display = 'block';
          const element = document.createElement("div");
          element.innerHTML = `<strong>From:</strong>${email.sender}<br><strong>To:</strong>${email.recipients}<br><strong>Subject:</strong>${email.subject}<br><strong>Timestamp:</strong>${email.timestamp}<br>`;
          document.getElementById('email-view').innerHTML = '';
          document.querySelector('#email-view').append(element);

          //Adding a button to unarchive email
          const archivebtn = document.createElement("button");
          archivebtn.innerHTML = 'Unarchive';
          archivebtn.setAttribute("id","archivebtn");
          archivebtn.setAttribute("class","btn btn-dark");
          document.querySelector('#email-view').appendChild(archivebtn);
          
          document.querySelector("#archivebtn").addEventListener('click', ()=> {
            fetch(`/emails/${email_id}`, {
              method: 'PUT',
              body: JSON.stringify({'archived': false})
            })
            .then(load_mailbox('inbox'));
          });

        })
      }
    })

  }

  })
  .catch((error) => {
    console.log(error);
  });
}