# Open Person Matching - v0.1-strawman

Open Person Matching is a protocol for finding and communicating documents
pertaining to a specific person identified by a sufficiently unique combination
of descriptors, among a network of many requestors, facilitators, and
responders, without disclosing the value of those descriptors to any responder,
requestor, or facilitator that does not already have them. Although its
technical implementation may vary, its basic mechanics describe a
publish-subscribe interaction between participants (Requestors and Responders)
and Facilitators.

## Version: 0.1-strawman

## Definitions

### Person

Cannonically, a unique human individual. Versions of this protocol could, in
theory, be adapted for matching organizations and other entities.

### Facilitator

An intermediary that recieves and broadcasts Requests on behalf of a Requestor,
then collates the Responses. The Facilitator serves to Authenticate and
Authorize the Requestor, where necessary, and keep Requestors and Responders
identity hidden from each other until direct communication is needed.

### Requestor

The party initiating a Search Flow or Exchange Flow

### Responder

One of zero or more entities that process a Request and send a Response to it
indicating that they have or may have documents for the matched person.

### Routing

The process of ensuring that Requests are delivered only to Responders that are
likely to have documents for the Person who is the subject of the Request. This
helps minimize traffic caused by searches and protects Responders from being
overwhelmed with Requests that are costly to evaluate that ultimately do not
match.

### Routing Salt

A relatively high entropy string, rotated periodically, which can be determined
independently by Requestors and Responders who have a common identifier (such as
First Name and Last Name) for a Person and is used along with that common
identifier as the source for a hash to generate a Routing Key. NOTE: the common
identifier must be the same across all participants in the network. It should
reduce the number of possibly matched Persons significantly, but probably should
not consistently be unique to each Person.

The method for determining Routing Salt sources is defined as a property of the
network. However, two example methods are outlined here:

1. Hash of recent blockchain blocks - As defined by the network, Facilitators
   (and potentially other participants) agree upon a blockchain from which to
   derive Routing Salt sources. As Routing Salt rotation periods expire Routing
   Salt sources are derived by inspecting the last 3 accepted blocks as of 10
   minutes before period expiry time. The nonces (or, alternatively, the Merkle
   Roots) of these blocks are concatenated together with the period expiry time
   as a Unix timestamp and used to create a SHA-2-256 hash that serves as the
   new Routing Salt source. Because the Routing Salt source is derived using a
   known algorithm from an external data source that contains unpredictable new
   material each participant can derive the recent Routing Salt sources
   independently and still derive a matching result. The blockchain itelf serves
   to provide authentication and redundancy for updating the Routing Salt
   source.
2. Published by Network Authority - An authoritative node on the network,
   perhaps run by the authority that approves Facilitators or participants for
   the network, generates cryptographically a random salt seed and publishes it
   to a well known location with the last three Routing Salt sources and their
   associated unique sequence identifier. Routing Salt sources MUST maintain
   proper sequence to avoid potential routing errors. Alternatively, the Network
   Authority can publish the most recent Routing Salt source to each Facilitator
   and require them to host the three most recent sources. However, this
   presents a greater risk of Routing Salt sources not maintaining
   synchronization (which may or may not be effectively mitigated by this
   specification's Routing Salt rotation provisions.) This method requires that
   the authoritative node have sufficient redundancy and provide some means for
   participants to authenticate updates from the authoritative node.
3. Cooperative XOR voting - As the Routing Salt rotation period is about to
   expire each Facilitator attempts to notify each other Facilitator of it's
   contribution to the new Routing Salt source - a cryptographically random 256
   byte sequence. One a Facilitator has valid (sufficiently high entropy)
   contributions from one quarter or more of the Facilitators it publishes a
   vote for the valid contributions it has recieved. Contributions that are
   included in the lesser of one quarter of top 10 most votes, including ties,
   are XOR'd together and published as a proposed Routing Salt (or just use Raft
   or Paxos...)

#### Deriving a Routing Salt

1. The participant obtains the active Routing Salt sources from the network's
   known source or a well known location hosted by their Facilitator
2. The participlant calculates a cryptographic hash (the specific algorithm is a
   property of the network, but likely SHA-2-256) of the common identifier for
   the Person using the Routing Salt source as the algorithm's salt.
3. The hash from step 2 is returned as bytes. This is the Routing Salt for the
   Person.

NOTE: other algorithms may be adopted as a property of the network.

### Routing Salt Rotation

Routing Salts and their resulting Routing Keys are only intended to be used for
a relatively short period of time in order to make it more difficult to
associate Routing Keys with a possible Person. Routing Salts are rotated by
updating their source material (decribed elsewhere.) Requests are expected to
contain Routing Keys from the 3 most recent Routing Salt rotations. Similarly,
Responders must maintain Routing Registrations for Routing Keys from multiple
rotation periods. Because Routing Salt Rotations require Responders to
recalculate and reregister Routing Keys the rotation period should not be so
frequent as to make reregistration prohibitively expensive.

### Routing Key

A crypotgraphic hash of a common identifier (such as First Name and Last Name)
for a Person and a Routing Salt that is used to route Requests to Responders
that are likely to have matching documents for the Person.

#### Deriving a Routing Key

1. The participant derives the Routing Salt for the Person
2. The participlant calculates a cryptographic hash (the specific algorithm is a
   property of the network, but likely SHA-2-256) of the common identifier for
   the Person using the Routing Salt as the hash algorithm's salt.
3. The hash from step 2 is converted to url safe base64. This is the Routing Key
   for the Person.

FIXME: Routing Salts and Keys require that the common identifier have various
standard normalization rules applied

### Routing Registration

A message to a Facilitator establishing an association between a Routing Key and
a Responder (which may be acting as a federating Facilitator for other
Responders) and/or the resulting asociation. Registrations tell Facilitators to
send Requests with a matching Routing Key to the registrant. Routing
Registrations may be deregistered by Responders that no longer need them.
Routing Registrations automatically expire after 5 Routing Salt Rotation
periods.

## Search Flow

The Open Person Matching Search Flow defines a process by which a Requestor may
discover a set of responders who have documents pertaining to a specific Person
identified by a sufficiently unique combination of descriptors without
disclosing the value of those descriptors to any Responder, Requestor, or
Facilitator that does not already have them.

### Roles in the Search Flow

There a 3 distinct roles in the Search Flow: Requestor, Facilitator, and
Responder

#### The Search Requestor

A Requestor initiates the Search Flow by sending a Request to at least one
Facilitator. A Requestor may prepare parallel Requests for multiple
Facilitators, each Request matching the same Person, but each Request must use
its own nonce to hash the Request's descriptors.

#### The Search Facilitator

A Facilitator recieves a Search Request from a Requestor. If the Request
contains Authorization data, the Facilitator must validate the Authorization
data before proceeding to further process the Request. After validation, the
Facilitator broadcasts the body of the Request, sans Authorization and signed by
the Facilitator, to the network of potential Responders. As Responses come in
the Facilitator anonymizes them and forwards them to Requestors for follow up.

Facilitators also recieve Routing Registrations from Responders. This is the
means by which Responders indicate that they should recieve Requests for a given
Routing Key.

#### The Search Responder

A Responder must register Routing Keys with a Facilitator for each Person for
which they have documents. This requires the Responder to subscribe to updates
to the Routing Salts and recalculate the Routing Keys promptly according to the
Routing Salt rotation strategy. When a Facilitator recieves a Request the
Request is forwareded to every Responder that has registered at least one
matching Routing Key. The Responder then uses the Request nonce to generate its
own values for the Request's descriptor hashes and prepares a Response using a
new nonce for each Person for whom the Routing Key matches. Note that this
implies that the Responder will want to store the Routing Keys currently
registered for each person in order to avoid a slow and costly calculation of
every Person's Routing Keys upon recieving each Request.

### Search Request

A Search Request is a JSON object containing these key - value pairs:

- `id` - a universally unique Request ID to correlate responses with requests
- `auth` - (optional) authorization data for the Request, if necessary. If
  present, the authorization data should be an object containing a `type` key
  with a well-known identifier indicating the protocol in use. No Request
  authentication protocols are specified at this time. Acceptable authentication
  protocols are defined by an implementing network and must be supported by all
  facilitators in the network.
- `route` - an array of 1 to 3 Routing Keys for the Request
- `nonce` - a 12-byte nonce in lowercase hexadecimal format from a
  cryptographically random source. This key is called `nonce` specifically to
  indicate that its value should never be used in more than one Request.
- `pub` - (optional) a session public key for the Request session, to be used
  for secure communication with a matched Responder
- `hashes` - an array of demographic hash objects, as defined next

A demographic hash object contains these key - value pairs:

- `t` - the well known "type" of the input demographic identifier.
- `h` - the hashed value, using the Request's nonce as the hashing algorithm's
  salt.
- `n` - an array of normalization rules applied to the value before calculating
  the hash. Rules should be applied in the order that they appear.
- `r` - an optional boolean indicating whether or not matching this hash is
  required. A `false` value indicates that the Requestor is aware that the
  Responder may or may not have this identifier. A `true` value indicates that
  the responder must have the identifier.

#### Well Known Demographic Identifier Types

- `full_name` - the Person's first and last name as it would likely appear on a
  government issued ID or medical card
- `given_name` - the Person's first given name
- `family_name` - the Person's family name

#### Well Known Demographic Identifier Nomalization Rules

- `lowercase` - all letters in the identifier should be converted to lowercase
- `uppercase` - all letters in the identifier should be converted to uppercase
- `s/{1}/{2}` - all sequences matching the pattern {1} should be replaced with
  the sequence {2}. For this version of this specification patterns should be
  syntactically correct Perl-compatible Regular Expressions though only very
  simple substitutions are supported (i.e. look-ahead, look-behind, capture
  groups, anchors, etc. will result in the Facilitator rejecting the Request)
- `no_space` - whitespace is removed
- `no_punct` - punctuation, such as `.`, `,`, `#`, `-`, etc. is removed

### Search Response

## Exchange Flow

The Exchange Flow enables the exchange of documents... it is more strict in its
matching requirements

### Roles in the Exchange Flow

### Exchange Request

### Exchange Response
