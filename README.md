# Open Person Matching

Open Person Matching is a person matching specification and reference
implementation. It allows searching for nodes in a network that have records for
a person without revealing that person's demographic information to those who do
not already have it. Its primary use case is supporting finding a person's
self-sovereign signing and encryption keys. This directly supports truly
self-sovereign identity, non-repudiatable signatures of electronic documents -
including digital authorization documents authorizing a person's agents to act
on their behalf - and private, client agnostic PKI-based encrypted
communications with options for spam filtering agents. These use cases and the
base algorithm also allow it to be used for patient matching and medical records
search, a domain from which it draws many design goals.

## Identity is not Authentication; Authentication is not Authorization

The distinction can sometimes be subtle, but it is very important.

A name is an identifier. It helps to uniquely select a person or thing from a
set of similar persons or things. But, just because you know my name does mean
that you are me.

Authentication is the process of proving that something is what it claims to be.
This involves both identifying the thing and verifying facts about it that prove
it is the identified thing. When you log in to a service with a username and
password the username identifies you uniquely among all other users of the
service. The password - in theory, something only you know - proves that you
know something only you could know (and that is both why passwords work and why
passwords fail.)

Authorization is the process of determining what an agent is allowed to do. An
agent is someone or something that works on a person (or group’s) behalf. It may
be the person themself, but it usually is not. In order to authorize an agent
the agent must be identified and authenticated, the authorizer must be
identified and authenticated, and the authorization must be defined and within
the authority of the authorizer to give.

That is, Authentication builds on Identity and Privacy. Authorization builds on
Authentication.

Why does this matter? Searching for a person's identity signing key, a patient’s
medical records, or other records requires that we first identify the person
that we are talking about. We also need to identify the person performing the
search. Having identified the searcher we need to authenticate them to ensure
that they are who they claim to be. Finally, we need to verify that they are
authorized to do the search.

Unfortunately, that's just the beginning. It is the bare minimum that we need to
do in a simple network environment where one entity controls the security of
each node and therefore trusts them. On such a simple network the controlling
entity knows that it is not disclosing confidential information, such as a
person's personally identifiable information or a potentially reusable
authentication token, by virtue of the fact that it controls every node.

A heterogeneous inter-organizational network may take steps to mimic that, but
it is not that. Every node is its own organization. They can agree to follow
certain policies and to allow audits, but the network has limited visibility in
to what each participant is actually doing. It is hard enough to secure a
network when you own every node. It is much harder when all you can do is
periodic audits. Communication protocols for an inter-organizational network
must meet a higher standard. An inter-organizationl network must take steps to
verify that it is only communicating confidential information to other nodes
that are authorized to recieve it or have demonstrated that they already have
it.

As of early 2026, Health Information Networks like Carequality and TEFCA are an
example of heterogeneous inter-organizational networks that take steps to mimic
a simpler network environment through varification of the entities that are
allowed to join and security controls like mutual TLS, audit logs, and periodic
audits. However, as is highlighted by Epic’s January 2026 lawsuit allegations
against Health Gorilla and others, these networks are made up of unique
organizations with different motivations and interpretations of their shared
standards that can lead to a loss of trust.

The lawsuit's alledged bad behavior relies on communication protocols that don’t
do request level authentication and authorization. Once an organization is on
the network there is only an organization level authentication and a basic check
to see if they are claiming a purpose of use for which the organization is
approved. There is documentation of the requestor and their National Provider
Identifier. But there is no authentication of the requestor, no authentication
of the patient they are acting on behalf of, and no verification of
authorization by the patient. The patients demographic information is sent with
the request and the response is sent based on the trust conferred on the
requestor and responder when they are given access to the network. In the case
of Individual Access Services - where patients use a service to request their
own records - the patient's identity is authenticated, but authorization
consists of limiting the patient to requesting their own information. Also,
patient information and the authentication token are still routed to providers
based on their trusted status on the network, leaving them available for
potential abuse.

Health Information Networks do take steps to ensure that requests are only
routed to providers that are likely to have a patient's records. This is often
handled by a Master Patient Index or Record Locator Service that has some
pre-populated knowledge or defined algorithm for routing requests. This has both
performance and security benefits. On the performance side, routing requests to
all possible providers would require bandwidth and compute resources that would
be prohibitivly expensive for participants to allocate. From a security
perspective, preventing patient personally identifiable information from being
sent to every possible provider means that every provider's audit logs don't
contain every possible patient's data. Notably, providers do not fully rely on
the network's patient matching and run their own patient matching to ensure they
don't disclose the wrong patient's health records. The implication is that the
MPI or RLS is likely to result in contacting at least some providers that will
not actually respond with records for the patient.

Because Open Person Matching is intended to operate not only in a trusted
network like a Health Information Network but also in an open one, it cannot
rely on audited trusted nodes. Even in a trusted network every point of trust
represents a point where security can fail. Open Person Matching seeks to learn
from and improve upon the design and experience of Health Information Networks.

## How it works

The Open Person Matching Protocol is designed to use cryptographic hashes of
demographic data and other identifiers to provide a high degree of certainty of
a matched person when both requesting and responding nodes have the same or
similar demographic data without revealing that data to anyone who does not
already have it.

There are two distinct types of hashes used in Open Patient Matching: routing
keys and demographic hashes.

### Routing Keys

Routing keys are hashes of a relatively low risk demographic identifier used to
route requests only to potential responders that may actually have a match. They
are often deliberately not entirely specific to a unique person in order to
avoid revealing information about the person being searched for - a key
requirement of the standard.

### Demographic Hashes

Demographic hashes are intended to uniquely identify a person - containing
multiple demographic identifiers as well as random bits to create a hash that is
relatively easy for a responder with the source demographics to recalculate and
match but extremely difficult for someone without that information to determine
the source demographics. Demographic hashes are the primary mechanism by which
Open Patient Matching proves that a responder and a requester both have matching
demographic information without disclosing it to parties that do not already
have it.

Cryptographic hashes are a well established tool used for decades for password
matching and document verification. They are also generally resistant to the
capabilities of quantum computers - so much so that some post-quantum
cryptographic algorithms are based on them.
